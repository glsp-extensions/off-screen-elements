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
import { IViewArgs, RenderingTargetKind, ViewRegistry } from 'sprotty/lib/base/views/view';
import { VNode } from 'snabbdom';
import { IVNodePostprocessor } from 'sprotty/lib/base/views/vnode-postprocessor';
import { ModelRenderer, SModelElement, SParentElement, SChildElement, BoundsAware } from '@eclipse-glsp/client';
import { isVisible } from './utils';
import { OffScreenElements } from './off-screen-elements';

export class OffScreenElementRenderer extends ModelRenderer {
    protected _postprocessors: IVNodePostprocessor[];

    constructor(
        viewRegistry: ViewRegistry,
        private offScreenElements: OffScreenElements,
        targetKind: RenderingTargetKind,
        postprocessors: IVNodePostprocessor[],
        args: IViewArgs
    ) {
        super(viewRegistry, targetKind, postprocessors, args);
        this._postprocessors = postprocessors;
    }

    override renderElement(element: Readonly<SModelElement>): VNode | undefined {
        const view = this.viewRegistry.get(element.type);
        let vnode = view.render(element, this, this.args);

        if (this.targetKind !== 'hidden' && !isVisible(element as SChildElement & BoundsAware, this)) {
            const offScreenVnode = this.offScreenElements.renderOffScreenElement(element, this);
            if (offScreenVnode !== undefined) {
                vnode = offScreenVnode;
            }
        }
        if (vnode) {
            return this.decorate(vnode, element);
        } else {
            return undefined;
        }
    }

    override renderChildren(element: Readonly<SParentElement>, args?: IViewArgs): VNode[] {
        const context = args
            ? new OffScreenElementRenderer(this.viewRegistry, this.offScreenElements, this.targetKind, this._postprocessors, {
                  ...args,
                  parentArgs: this.args
              })
            : this;
        return element.children.map(child => context.renderElement(child)).filter(vnode => vnode !== undefined) as VNode[];
    }
}
