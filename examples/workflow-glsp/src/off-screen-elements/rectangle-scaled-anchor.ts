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
import { RectangleAnchor, PolylineEdgeRouter, SConnectableElement, Point, getZoom } from '@eclipse-glsp/client';
import { RECTANGULAR_SCALED_ANCHOR_KIND } from './models';

export class RectangleScaledAnchor extends RectangleAnchor {
    override get kind(): string {
        return PolylineEdgeRouter.KIND + ':' + RECTANGULAR_SCALED_ANCHOR_KIND;
    }
    override getAnchor(connectable: SConnectableElement, refPoint: Point, offset = 0): Point {
        const zoomFactor = getZoom(connectable.root);
        const originalBounds = connectable.bounds;

        connectable.bounds = {
            ...connectable.bounds,
            width: connectable.bounds.width / zoomFactor,
            height: connectable.bounds.height / zoomFactor
        };

        const p = super.getAnchor(connectable, refPoint, offset);
        connectable.bounds = originalBounds;
        return p;
    }
}
