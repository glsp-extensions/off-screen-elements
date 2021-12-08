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
import {RenderingContext, SModelElement } from '@eclipse-glsp/client';
import {VNode} from 'snabbdom';

import {svg} from 'sprotty';
import {InstanceRegistry} from 'sprotty/lib/utils/registry';
import {WORKFLOW_TYPES} from '../workflow-types';
import {IViewArgs} from 'sprotty/src/base/views/view';
import {TaskNodeOffScreenElement} from './models';
import {TaskNode} from '../model';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const JSX = { createElement: svg };

@injectable()
export class OffScreenViewRegistry extends InstanceRegistry<IViewOffScreen> {
    constructor(@multiInject(WORKFLOW_TYPES.OffScreenViewRegistration) @optional() registrations: OffScreenViewRegistration[]) {
        super();
        registrations.forEach(registration =>
            this.register(registration.type, registration.factory())
        );
    }
}

@injectable()
export class TaskNodeOffScreenView implements IViewOffScreen {
    render(element: TaskNodeOffScreenElement, offScreenElement: TaskNode, context: RenderingContext, args: { zoom: number }): VNode {
        // two groups because first one is managed by sprotty
        const translatedX = element.position.x - offScreenElement.position.x;
        const translatedY = element.position.y - offScreenElement.position.y;
        return (
            <g>
                <g
                    transform={`scale(${args.zoom}) translate(${translatedX}, ${translatedY})`}
                    style={{transformOrigin: `${translatedX}px ${translatedY}px`}}>
                    <rect
                        width={element.size.width}
                        height={element.size.height}
                        rx={6}
                        ry={6}
                        class={{'off-screen-task': true, [`off-screen-task-${offScreenElement.taskType}`]: true}}
                    ></rect>
                </g>
            </g>
        );
    }
}

export interface IViewOffScreen<A extends IViewArgs = Record<string, any>> {
    render(model: Readonly<SModelElement>, offScreenModel: Readonly<SModelElement>, context: RenderingContext, args?: A): VNode | undefined
}

export interface OffScreenViewRegistration {
    type: string
    factory: () => IViewOffScreen
}
