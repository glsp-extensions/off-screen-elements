/********************************************************************************
 * Copyright (c) 2019-2021 EclipseSource and others.
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
import {
    angleOfPoint,
    IView,
    Point,
    PolylineEdgeViewWithGapsOnIntersections,
    RenderingContext,
    SEdge,
    toDegrees
} from '@eclipse-glsp/client';
import {inject, injectable} from 'inversify';
import { VNode } from 'snabbdom';
import { svg} from 'sprotty';
import { Icon } from './model';
import {IViewArgs} from 'sprotty/lib/base/views/view';
import {WORKFLOW_TYPES} from './workflow-types';
import {OffScreenElements} from './off-screen-elements/off-screen-elements';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const JSX = { createElement: svg };

@injectable()
export class WorkflowEdgeView extends PolylineEdgeViewWithGapsOnIntersections {

    @inject(WORKFLOW_TYPES.OffScreenElements)
    offScreenElement: OffScreenElements;

    protected renderAdditionals(edge: SEdge, segments: Point[], context: RenderingContext): VNode[] {
        const additionals = super.renderAdditionals(edge, segments, context);
        const p1 = segments[segments.length - 2];
        const p2 = segments[segments.length - 1];
        const arrow = (
            <path
                class-sprotty-edge={true}
                class-arrow={true}
                d='M 1.5,0 L 10,-4 L 10,4 Z'
                transform={`rotate(${toDegrees(angleOfPoint({ x: p1.x - p2.x, y: p1.y - p2.y }))} ${p2.x} ${p2.y}) translate(${p2.x} ${
                    p2.y
                })`}
            />
        );
        additionals.push(arrow);
        return additionals;
    }

    render(edge: SEdge, context: RenderingContext, args?: IViewArgs): VNode | undefined {
        // replace target and source with off-screen elements
        if (edge.target) {
            edge.targetId = this.offScreenElement.getElementId(edge.target, context);
        }

        if (edge.source) {
            edge.sourceId = this.offScreenElement.getElementId(edge.source, context);
        }

        // todo: find a better solution
        // always re-calculate positions of edges
        // sometimes old routing points are not correct
        // (e.g., when off screen element re-appears after a zoom event, or right after a setModel server round trip)
        delete args?.edgeRouting;

        return super.render(edge, context, args);
    }
}

@injectable()
export class IconView implements IView {
    render(element: Icon, context: RenderingContext): VNode {
        const radius = this.getRadius();
        return (
            <g>
                <circle class-sprotty-icon={true} r={radius} cx={radius + 2} cy={radius + 2}></circle>
                {context.renderChildren(element)}
            </g>
        );
    }

    getRadius(): number {
        return 14;
    }
}
