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
import 'reflect-metadata';
import { ContainerModule } from 'inversify';
import { OffScreenElementRenderer } from './off-screen-element-renderer';
import { IViewArgs, RenderingTargetKind, ViewRegistry } from 'sprotty/lib/base/views/view';
import { IVNodePostprocessor } from 'sprotty/lib/base/views/vnode-postprocessor';
import { OffScreenViewRegistry, TaskNodeOffScreenView } from './off-screen-views';
import { WORKFLOW_TYPES } from '../workflow-types';
import { configureOffScreenModelElement, OffScreenElements } from './off-screen-elements';
import { OffScreenModelRegistry, TaskNodeOffScreenElement } from './models';
import { RectangleScaledAnchor } from './rectangle-scaled-anchor';
import { TYPES } from '@eclipse-glsp/client';
import { ScrollToOffScreenElementTool } from './scroll-to-off-screen-element-tool';

export const offScreenElements = new ContainerModule((bind, unbind, isBound, rebind) => {
    const context = { bind, unbind, isBound, rebind };

    bind(TYPES.IDefaultTool).to(ScrollToOffScreenElementTool);

    bind(TYPES.IAnchorComputer).to(RectangleScaledAnchor).inSingletonScope();

    bind(WORKFLOW_TYPES.OffScreenElements).to(OffScreenElements).inSingletonScope();

    bind(WORKFLOW_TYPES.OffScreenViewRegistry).to(OffScreenViewRegistry).inSingletonScope();
    bind(WORKFLOW_TYPES.OffScreenModelRegistry).to(OffScreenModelRegistry).inSingletonScope();

    configureOffScreenModelElement(context, 'task:automated', TaskNodeOffScreenElement, TaskNodeOffScreenView);
    configureOffScreenModelElement(context, 'task:manual', TaskNodeOffScreenElement, TaskNodeOffScreenView);

    // rebind ModelRendererFactory to create custom OffScreenElementRenderer
    unbind(TYPES.ModelRendererFactory);
    bind(TYPES.ModelRendererFactory).toFactory<OffScreenElementRenderer>(
        ctx =>
            (targetKind: RenderingTargetKind, processors: IVNodePostprocessor[], args: IViewArgs = {}) => {
                const viewRegistry = ctx.container.get<ViewRegistry>(TYPES.ViewRegistry);
                const _offScreenElements = ctx.container.get<OffScreenElements>(WORKFLOW_TYPES.OffScreenElements);

                return new OffScreenElementRenderer(viewRegistry, _offScreenElements, targetKind, processors, args);
            }
    );
});
