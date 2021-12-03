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
import {IView} from 'sprotty';
import {isInjectable, RenderingContext, SModelElement, SShapeElement} from '@eclipse-glsp/client';
import {interfaces, injectable, inject} from 'inversify';
import {OffScreenViewRegistry} from './off-screen-views';
import {OffScreenModelRegistry, registerOffScreenModelElement} from './models';
import {assignBorderPositionAndSize} from './utils';
import {VNode} from 'snabbdom';

@injectable()
export class OffScreenElements {
    @inject(WORKFLOW_TYPES.OffScreenModelRegistry)
    protected offScreenModelRegistry: OffScreenModelRegistry;

    @inject(WORKFLOW_TYPES.OffScreenViewRegistry)
    protected offScreenViewRegistry: OffScreenViewRegistry;

    public renderOffScreenElement(offScreenElement: SModelElement, context: RenderingContext): VNode | undefined {
        if (!this.offScreenModelRegistry.hasKey(offScreenElement.type)) {
            return;
        }

        const indicatorElement = this.offScreenModelRegistry.get(offScreenElement.type);

        assignBorderPositionAndSize(indicatorElement, offScreenElement as SShapeElement);

        const offScreenView = this.offScreenViewRegistry.get(offScreenElement.type);
        return offScreenView.render(
            indicatorElement,
            context
        );
    }
}

export function configureOffScreenModelElement(
    context: { bind: interfaces.Bind; isBound: interfaces.IsBound },
    type: string,
    modelConstr: new () => SShapeElement,
    constr: interfaces.ServiceIdentifier<IView>
): void {
    registerOffScreenModelElement(context, type, modelConstr);
    configureOffScreenView(context, type, constr);
}

export function configureOffScreenView(
    context: { bind: interfaces.Bind; isBound: interfaces.IsBound },
    type: string,
    constr: interfaces.ServiceIdentifier<IView>
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

