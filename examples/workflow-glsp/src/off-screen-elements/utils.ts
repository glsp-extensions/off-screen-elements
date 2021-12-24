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
    Point,
    Bounds,
    getZoom,
    SModelElement,
    toAbsoluteBounds
} from '@eclipse-glsp/client';
import { BoundsAware } from 'sprotty/src/features/bounds/model';

export function isVisible(model: Readonly<SChildElement & BoundsAware>, context?: RenderingContext): boolean {
    if (context && context.targetKind === 'hidden') {
        return true;
    }

    const ab = getAbsoluteBounds(model);
    const canvasBounds = model.root.canvasBounds;
    return ab.x <= canvasBounds.width && ab.x + ab.width >= 0 && ab.y <= canvasBounds.height && ab.y + ab.height >= 0;
}

export function toRelativePoint(point: Point, modelElement: SModelElement & BoundsAware): Point {
    const zoomFactor = getZoom(modelElement.root);
    const absoluteBounds = toAbsoluteBounds(modelElement);
    const b = modelElement.root.parentToLocal({
        x: point.x - absoluteBounds.x * zoomFactor,
        y: point.y - absoluteBounds.y * zoomFactor
    });
    return { x: b.x, y: b.y };
}
export function getCenterPoint(modelBounds: Bounds, zoomFactor = 1): Point {
    return {
        x: modelBounds.x + (modelBounds.width / 2) * zoomFactor,
        y: modelBounds.y + (modelBounds.height / 2) * zoomFactor
    };
}

export function areOverlappingWithZoom(element1: SModelElement & BoundsAware, element2: SModelElement & BoundsAware, sizeMultiplier = 1): boolean {
    let zoomFactor = getZoom(element1.root);

    zoomFactor = zoomFactor / sizeMultiplier;

    const b1 = toAbsoluteBounds(element1);
    const b2 = toAbsoluteBounds(element2);
    const r1TopLeft: Point = b1;
    const r1BottomRight = { x: b1.x + b1.width/zoomFactor, y: b1.y + b1.height/zoomFactor };
    const r2TopLeft: Point = b2;
    const r2BottomRight = { x: b2.x + b2.width/zoomFactor, y: b2.y + b2.height/zoomFactor };

    // If one rectangle is on left side of other
    if (r1TopLeft.x > r2BottomRight.x || r2TopLeft.x > r1BottomRight.x) {
        return false;
    }

    // If one rectangle is above other
    if (r1BottomRight.y < r2TopLeft.y || r2BottomRight.y < r1TopLeft.y) {
        return false;
    }

    return true;
}

export function getBorderIntersectionPoint(a: Point, r: Bounds): Point {
    const s = (r.y - a.y) / (r.x - a.x);
    const hsw = (s * r.width) / 2;
    const hsh = r.height / 2 / s;
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
    if (-hw <= hsh && hsh <= hw) {
        if (r.y < a.y) {
            // top edge
            x = r.x + hh / s;
            y = r.y + hh;
        } else if (r.y > a.y) {
            // bottom edge
            x = r.x - hh / s;
            y = r.y - hh;
        }
    }

    return { x, y };
}
