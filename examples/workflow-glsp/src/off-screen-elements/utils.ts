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
import {
    SChildElement,
    RenderingContext,
    getAbsoluteBounds,
    SShapeElement,
    Point,
    Bounds,
    getZoom, SModelElement,
    toAbsoluteBounds
} from '@eclipse-glsp/client';
import {BoundsAware} from 'sprotty/src/features/bounds/model';

export function isVisible(model: Readonly<SChildElement & BoundsAware>, context: RenderingContext): boolean {
    if (context.targetKind === 'hidden') {
        return true;
    }

    const ab = getAbsoluteBounds(model);
    const canvasBounds = model.root.canvasBounds;
    return ab.x <= canvasBounds.width
        && ab.x + ab.width >= 0
        && ab.y <= canvasBounds.height
        && ab.y + ab.height >= 0;
}

export function toRelativePoint(point: Point, modelElement: SModelElement & BoundsAware): Point {
    const zoomFactor = getZoom(modelElement.root);
    const absoluteBounds = toAbsoluteBounds(modelElement);
    const b = modelElement.root.parentToLocal({
        x: (point.x - (absoluteBounds.x * zoomFactor)),
        y: (point.y - (absoluteBounds.y * zoomFactor))
    });
    return { x: b.x, y: b.y};
}
export function getCenterPoint(modelElement: SShapeElement, zoomFactor = getZoom(modelElement.root)): Point {
    return {
        x: modelElement.position.x + (modelElement.size.width/2 * zoomFactor),
        y: modelElement.position.y + (modelElement.size.height/2 * zoomFactor)
    };
}

export function assignBorderPositionAndSize(indicatorModel: SShapeElement, offScreenElement: SShapeElement): void {
    /*
    element position is always at the top left corner but for calculation of the
    intersection point, it should be at the center of the element.
    This means, that the position of both elements, offScreenElement and indicatorModel,
    have to be adjusted.
     */

    const elementPosition = offScreenElement.root.localToParent(getCenterPoint(offScreenElement));

    const centerPoint = {
        x: offScreenElement.root.canvasBounds.width/2,
        y: offScreenElement.root.canvasBounds.height/2
    };
    const intersectionPoint = getBorderIntersectionPoint(elementPosition, {
        ...centerPoint,
        width: offScreenElement.root.canvasBounds.width - indicatorModel.size.width,
        height: offScreenElement.root.canvasBounds.height - indicatorModel.size.height
    });

    indicatorModel.position = toRelativePoint(intersectionPoint, offScreenElement);
    const zoomFactor = getZoom(offScreenElement.root);
    indicatorModel.size = {
        width: indicatorModel.size.width/zoomFactor,
        height: indicatorModel.size.height/zoomFactor
    };
    indicatorModel.position = getCenterPoint(indicatorModel, -1);

}

function getBorderIntersectionPoint(a: Point, r: Bounds): Point {
    const s = (r.y - a.y) / (r.x - a.x);
    const hsw = s * r.width / 2;
    const hsh = ( r.height / 2 ) / s;
    const hh = r.height / 2;
    const hw = r.width / 2;

    let x = 0;
    let y = 0;
    if (-hh <= hsw && hsw <= hh) {
        // line intersects
        if (r.x < a.x) {
            // right edge;
            x = r.x + hw;
            y = r.y + s * hw;
        } else if (r.x > a.x) {
            // left edge
            x = r.x - hw;
            y = r.y - s * hw;
        }
    }
    if ( -hw <= hsh && hsh <= hw) {
        if (r.y < a.y) {
            // top edge
            x = r.x + hh/s;
            y = r.y + hh;
        } else if (r.y > a.y) {
            // bottom edge
            x = r.x - hh/s;
            y = r.y - hh;
        }
    }

    return { x, y };
}
