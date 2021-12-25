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
import {Action, BaseGLSPTool, CenterAction, MouseListener, SelectAction, SModelElement} from '@eclipse-glsp/client';
import { inject, injectable } from 'inversify';
import { WORKFLOW_TYPES } from '../workflow-types';
import { OffScreenElements } from './off-screen-elements';

@injectable()
export class ScrollToOffScreenElementTool extends BaseGLSPTool {
    @inject(WORKFLOW_TYPES.OffScreenElements)
    offScreenElements: OffScreenElements;

    static readonly ID = 'glsp.scroll-to-element-tool';

    protected offScreenElementMouseListener: MouseListener;

    get id(): string {
        return ScrollToOffScreenElementTool.ID;
    }

    protected createOffScreenElementMouseListener(): MouseListener {
        return new OffScreenElementMouseListener(this.offScreenElements);
    }

    enable(): void {
        this.offScreenElementMouseListener = this.createOffScreenElementMouseListener();
        this.mouseTool.register(this.offScreenElementMouseListener);
    }
    disable(): void {
        this.mouseTool.deregister(this.offScreenElementMouseListener);
    }
}

class OffScreenElementMouseListener extends MouseListener {
    private offScreenElements: OffScreenElements;

    constructor(offScreenElements: OffScreenElements) {
        super();
        this.offScreenElements = offScreenElements;
    }

    mouseUp(element: SModelElement, event: MouseEvent): Action[] {
        const offScreenElement = this.offScreenElements.getOffScreenIndicator(element.id);

        if (offScreenElement?.indicator) {
            const elementIds = offScreenElement.overlaps.map(elm => elm.element.id);
            return [
                new SelectAction(elementIds),
                new CenterAction(elementIds, true, false)
            ];
        }
        return [];
    }
}
