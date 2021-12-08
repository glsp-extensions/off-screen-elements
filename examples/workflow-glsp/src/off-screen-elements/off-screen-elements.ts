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

import {WORKFLOW_TYPES} from '../workflow-types';
import {
    BoundsAware,
    getZoom,
    isInjectable,
    RenderingContext, SChildElement, SConnectableElement,
    SModelElement,
    SShapeElement
} from '@eclipse-glsp/client';
import {interfaces, injectable, inject} from 'inversify';
import {IViewOffScreen, OffScreenViewRegistry} from './off-screen-views';
import {OffScreenModelRegistry, registerOffScreenModelElement} from './models';
import {getBorderIntersectionPoint, getCenterPoint, isVisible, toRelativePoint} from './utils';
import {VNode} from 'snabbdom';
import {Point} from '@eclipse-glsp/protocol';

@injectable()
export class OffScreenElements {
    @inject(WORKFLOW_TYPES.OffScreenModelRegistry)
    protected offScreenModelRegistry: OffScreenModelRegistry;

    @inject(WORKFLOW_TYPES.OffScreenViewRegistry)
    protected offScreenViewRegistry: OffScreenViewRegistry;

    private static OFF_SCREEN_ELEMENT_POSTFIX = '_off-screen-proxy';

    private lastViewportCenterPoint: Point = { x: 0, y: 0};

    private getOffScreenElementId(elementId: string, type: string | undefined = undefined): string {
        if (type !== undefined && !this.offScreenModelRegistry.hasKey(type)) {
            return this.getOnScreenElementId(elementId);
        }

        return this.isOffScreenElementId(elementId) ?
            elementId :
            elementId + OffScreenElements.OFF_SCREEN_ELEMENT_POSTFIX;
    }

    private getOnScreenElementId(elementId: string): string {
        return this.isOffScreenElementId(elementId) ?
            elementId.slice(0, -OffScreenElements.OFF_SCREEN_ELEMENT_POSTFIX.length) :
            elementId;
    }

    public getElementId(element: SConnectableElement, context: RenderingContext): string {
        const _element = (element as SChildElement).root.index.getById(this.getOnScreenElementId(element.id));

        if (_element !== undefined) {
            const offScreenTargetId = this.getOffScreenElementId(_element.id, _element.type);

            return isVisible(_element as SChildElement & BoundsAware, context) ? _element.id : offScreenTargetId;
        }

        return element.id;
    }

    public isOffScreenElementId(elementId: string): boolean {
        return elementId.endsWith(OffScreenElements.OFF_SCREEN_ELEMENT_POSTFIX);
    }
    public renderOffScreenElement(offScreenElement: SModelElement, context: RenderingContext): VNode | undefined {
        if (!this.offScreenModelRegistry.hasKey(offScreenElement.type)) {
            return;
        }

        const id = `${offScreenElement.id}${OffScreenElements.OFF_SCREEN_ELEMENT_POSTFIX}`;
        let indicatorElement = offScreenElement.index.getById(id) as SShapeElement;

        if (indicatorElement === undefined) {
            indicatorElement = this.offScreenModelRegistry.get(offScreenElement.type) as SShapeElement;
            indicatorElement.id = id;

            // todo: proxy elements require a parent for edges to be connected to it but parent is read only
            // indicatorElement.parent = (offScreenElement as SChildElement).parent;
            Object.assign(indicatorElement, { parent: (offScreenElement as SChildElement).parent });

            offScreenElement.index.add(indicatorElement);
        }

        this.assignBorderPosition(indicatorElement, offScreenElement as SShapeElement, context.targetKind === 'hidden');
        const offScreenView = this.offScreenViewRegistry.get(offScreenElement.type);

        return offScreenView.render(
            indicatorElement,
            offScreenElement,
            context,
            { zoom: 1/getZoom(offScreenElement)}
        );
    }

    assignBorderPosition(indicatorModel: SShapeElement, offScreenElement: SShapeElement, useSavedPoints = false): void {
        /*
        element position is always at the top left corner but for calculation of the
        intersection point, it should be at the center of the element.
        This means, that the position of both elements, offScreenElement and indicatorModel,
        have to be adjusted.
         */

        const zoomFactor = getZoom(offScreenElement.root);

        const elementBounds = offScreenElement.root.localToParent(offScreenElement.position);
        const elementCenterPoint = getCenterPoint(
            { ...elementBounds, width: offScreenElement.size.width, height: offScreenElement.size.height },
            zoomFactor
        );

        let stageCenterPoint = {
            x: offScreenElement.root.canvasBounds.width/2,
            y: offScreenElement.root.canvasBounds.height/2
        };

        if (useSavedPoints) {
            stageCenterPoint = this.lastViewportCenterPoint;
        } else {
            this.lastViewportCenterPoint = stageCenterPoint;
        }

        const intersectionPoint = getBorderIntersectionPoint(elementCenterPoint, {
            ...stageCenterPoint,
            width: offScreenElement.root.canvasBounds.width - (indicatorModel.size.width),
            height: offScreenElement.root.canvasBounds.height - (indicatorModel.size.height)
        });

        indicatorModel.position = toRelativePoint(intersectionPoint, offScreenElement);

        indicatorModel.position = getCenterPoint(
            { ...indicatorModel.position, width: indicatorModel.size.width, height: indicatorModel.size.height },
            -1/zoomFactor
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

