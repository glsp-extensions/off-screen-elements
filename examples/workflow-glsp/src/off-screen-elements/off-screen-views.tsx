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
import {injectable, multiInject, optional} from 'inversify';
import {IView, RenderingContext, SShapeElement} from '@eclipse-glsp/client';
import {VNode} from 'snabbdom';

import {svg} from 'sprotty';
import {InstanceRegistry} from 'sprotty/lib/utils/registry';
import {ViewRegistration} from 'sprotty/lib/base/views/view';
import {WORKFLOW_TYPES} from '../workflow-types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const JSX = { createElement: svg };

@injectable()
export class TaskNodeOffScreenView implements IView {
    render(element: SShapeElement, context: RenderingContext): VNode {
        return (
            <rect x={element.position.x}
                  y={element.position.y}
                  width={element.size.width}
                  height={element.size.height}
            transform={'translate(0, 0)'}>
            </rect>
        );
    }
}

@injectable()
export class OffScreenViewRegistry extends InstanceRegistry<IView> {
    constructor(@multiInject(WORKFLOW_TYPES.OffScreenViewRegistration) @optional() registrations: ViewRegistration[]) {
        super();
        registrations.forEach(registration =>
            this.register(registration.type, registration.factory())
        );
    }
}
