/********************************************************************************
 * Copyright (c) 2021 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { WORKFLOW_TYPES } from '../workflow-types';
import {
    BoundsAware,
    getZoom,
    isInjectable,
    RenderingContext,
    SChildElement,
    SConnectableElement,
    SModelElement,
    SParentElement,
    SShapeElement
} from '@eclipse-glsp/client';
import { interfaces, injectable, inject } from 'inversify';
import { IViewOffScreen, OffScreenViewRegistry } from './off-screen-views';
import { OffScreenModelRegistry, registerOffScreenModelElement } from './models';
import { areOverlappingWithZoom, getBorderIntersectionPoint, getCenterPoint, isVisible, toRelativePoint } from './utils';
import { VNode } from 'snabbdom';
import { Point } from '@eclipse-glsp/protocol';

const OVERLAP_SIZE_MULTIPLIER = 4;

@injectable()
export class OffScreenElements {
    @inject(WORKFLOW_TYPES.OffScreenModelRegistry)
    protected offScreenModelRegistry: OffScreenModelRegistry;

    @inject(WORKFLOW_TYPES.OffScreenViewRegistry)
    protected offScreenViewRegistry: OffScreenViewRegistry;

    private static OFF_SCREEN_ELEMENT_POSTFIX = '_off-screen-proxy';
    private offScreenIndicators: Record<string, OffScreenElementToRender> = {};

    public getOffScreenElementId(elementId: string, type: string | undefined = undefined): string {
        if (type !== undefined && !this.offScreenModelRegistry.hasKey(type)) {
            return this.getOnScreenElementId(elementId);
        }

        return this.isOffScreenElementId(elementId) ? elementId : elementId + OffScreenElements.OFF_SCREEN_ELEMENT_POSTFIX;
    }

    private getOnScreenElementId(elementId: string): string {
        return this.isOffScreenElementId(elementId) ? elementId.slice(0, -OffScreenElements.OFF_SCREEN_ELEMENT_POSTFIX.length) : elementId;
    }

    public getElementId(element: SConnectableElement, context: RenderingContext): string {
        const _element = (element as SChildElement).root.index.getById(this.getOnScreenElementId(element.id));

        if (_element !== undefined) {
            const offScreenTargetId = this.getOffScreenElementId(_element.id, _element.type);

            return isVisible(_element as SChildElement & BoundsAware, context) ? _element.id : offScreenTargetId;
        }

        return element.id;
    }

    public getOffScreenIndicator(elementId: string): OffScreenElementToRender | undefined {
        return this.offScreenIndicators[elementId];
    }

    public isOffScreenElementId(elementId: string): boolean {
        return elementId.endsWith(OffScreenElements.OFF_SCREEN_ELEMENT_POSTFIX);
    }

    public createOffScreenElements(parent: SParentElement, context: RenderingContext): void {
        this.offScreenIndicators = {};
        this.createOffScreenElementsRec(parent, context);
        this.findOverlaps();
        this.calculateNewPositions();
    }

    private findOverlaps(): void {
        const groups: OffScreenElementToRender[][] = [];

        // create groups of overlapping elements

        const ungroupedElementIds = Object.keys(this.offScreenIndicators);

        while (ungroupedElementIds.length > 0) {
            let overlapFound = false;

            // iterate over all elements and add them to groups if possible
            for (let i = 0; i < ungroupedElementIds.length; i++) {
                const nextElementId = ungroupedElementIds[i];

                loop1: for (const group of groups) {
                    for (const element of group) {
                        if (
                            areOverlappingWithZoom(
                                this.offScreenIndicators[nextElementId].indicator,
                                element.indicator,
                                OVERLAP_SIZE_MULTIPLIER
                            )
                        ) {
                            group.push(this.offScreenIndicators[nextElementId]);
                            this.offScreenIndicators[nextElementId].overlaps = group;
                            ungroupedElementIds.splice(i, 1);
                            i--;
                            overlapFound = true;
                            break loop1;
                        }
                    }
                }
            }

            // create a new group only if no overlaps have been found in the previous iteration
            // if overlap has been found, iterate over all again
            if (!overlapFound) {
                const elementToAdd = ungroupedElementIds.pop();
                if (elementToAdd) {
                    const newGroup = [this.offScreenIndicators[elementToAdd]];
                    groups.push(newGroup);
                    this.offScreenIndicators[elementToAdd].overlaps = newGroup;
                }
            }
        }
    }

    private calculateNewPositions(): void {
        for (const element of Object.values(this.offScreenIndicators)) {
            if (element.overlaps.length > 1) {
                // get average point
                const centerPoints: Point[] = element.overlaps.map(sshape => getCenterPoint(sshape.element.bounds));
                let averagePoint: Point = {
                    x: centerPoints.reduce((prev, curr) => prev + curr.x, 0),
                    y: centerPoints.reduce((prev, curr) => prev + curr.y, 0)
                };
                averagePoint = {
                    x: averagePoint.x / element.overlaps.length,
                    y: averagePoint.y / element.overlaps.length
                };

                const originalPosition = element.element.position;

                element.element.position = averagePoint;
                this.assignBorderPosition(element.indicator, element.element, false);
                element.element.position = originalPosition;
            }
        }
    }

    public createOffScreenElementsRec(parent: SParentElement, context: RenderingContext): void {
        if (this.offScreenModelRegistry.hasKey(parent.type) && !isVisible(parent as SChildElement & BoundsAware, context)) {
            const id = `${parent.id}${OffScreenElements.OFF_SCREEN_ELEMENT_POSTFIX}`;
            let indicatorElement = parent.index.getById(id) as SShapeElement;

            if (indicatorElement === undefined) {
                indicatorElement = this.offScreenModelRegistry.get(parent.type) as SShapeElement;
                indicatorElement.id = id;

                // todo: proxy elements require a parent for edges to be connected to it but parent is read only
                // indicatorElement.parent = (offScreenElement as SChildElement).parent;
                Object.assign(indicatorElement, { parent: (parent as SChildElement).parent });

                parent.index.add(indicatorElement);
            }

            this.assignBorderPosition(indicatorElement, parent as SShapeElement);
            this.offScreenIndicators[parent.id] = { indicator: indicatorElement, element: parent as SShapeElement, overlaps: [] };
        }

        for (const child of parent.children) {
            this.createOffScreenElementsRec(child, context);
        }
    }

    public renderOffScreenElement(offScreenElement: SModelElement, context: RenderingContext): VNode | undefined {
        if (!this.offScreenIndicators[offScreenElement.id]) {
            return;
        }

        // only render first element of overlaps
        if (
            this.offScreenIndicators[offScreenElement.id].overlaps.length &&
            this.offScreenIndicators[offScreenElement.id].overlaps[0].element.id !== offScreenElement.id
        ) {
            return;
        }

        // Instead of using a proxy of a single element as a representation for multiple grouped elements,
        // a new type of visual element should be created that is independent of any original elements.
        // This would not trigger any additional effects, as for example the tooltip when hovering over a group

        const offScreenView = this.offScreenViewRegistry.get(offScreenElement.type);

        return offScreenView.render(this.offScreenIndicators[offScreenElement.id].indicator, offScreenElement, context, {
            zoom: 1 / getZoom(offScreenElement),
            numberOfOverlaps: this.offScreenIndicators[offScreenElement.id].overlaps.length
        });
    }

    assignBorderPosition(indicatorModel: SShapeElement, offScreenElement: SShapeElement, calculateCenter = true): void {
        // element position is always at the top left corner but for calculation of the
        // intersection point, it should be at the center of the element.
        // This means, that the position of both elements, offScreenElement and indicatorModel,
        // have to be adjusted.

        const zoomFactor = getZoom(offScreenElement.root);

        const elementBounds = offScreenElement.root.localToParent(offScreenElement.position);

        let elementCenterPoint = { x: elementBounds.x, y: elementBounds.y };
        if (calculateCenter) {
            elementCenterPoint = getCenterPoint(
                { ...elementBounds, width: offScreenElement.size.width, height: offScreenElement.size.height },
                zoomFactor
            );
        }

        const stageCenterPoint = {
            x: offScreenElement.root.canvasBounds.width / 2,
            y: offScreenElement.root.canvasBounds.height / 2
        };

        const intersectionPoint = getBorderIntersectionPoint(elementCenterPoint, {
            ...stageCenterPoint,
            width: offScreenElement.root.canvasBounds.width - indicatorModel.size.width,
            height: offScreenElement.root.canvasBounds.height - indicatorModel.size.height
        });

        indicatorModel.position = toRelativePoint(intersectionPoint, offScreenElement);

        indicatorModel.position = getCenterPoint(
            { ...indicatorModel.position, width: indicatorModel.size.width, height: indicatorModel.size.height },
            -1 / zoomFactor
        );
        indicatorModel.position = {
            x: indicatorModel.position.x + offScreenElement.position.x,
            y: indicatorModel.position.y + offScreenElement.position.y
        };
    }
}

export function configureOffScreenModelElement(
    context: { bind: interfaces.Bind; isBound: interfaces.IsBound },
    type: string,
    modelConstr: new () => SModelElement,
    constr: interfaces.ServiceIdentifier<IViewOffScreen>
): void {
    registerOffScreenModelElement(context, type, modelConstr);
    configureOffScreenView(context, type, constr);
}

export function configureOffScreenView(
    context: { bind: interfaces.Bind; isBound: interfaces.IsBound },
    type: string,
    constr: interfaces.ServiceIdentifier<IViewOffScreen>
): void {
    if (typeof constr === 'function') {
        if (!isInjectable(constr)) {
            throw new Error(`Views should be @injectable: ${constr.name}`);
        }
        if (!context.isBound(constr)) {
            context.bind(constr).toSelf();
        }
    }
    context.bind(WORKFLOW_TYPES.OffScreenViewRegistration).toDynamicValue(ctx => ({
        type,
        factory: () => ctx.container.get(constr)
    }));
}

interface OffScreenElementToRender {
    indicator: SShapeElement;
    element: SShapeElement;
    overlaps: OffScreenElementToRender[];
}
