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
    boundsFeature,
    FactoryRegistry,
    LayoutContainer,
    SShapeElement
} from '@eclipse-glsp/client';
import {injectable, interfaces, multiInject, optional} from 'inversify';
import {CustomFeatures} from 'sprotty/src/base/model/smodel-factory';
import {WORKFLOW_TYPES} from '../workflow-types';

export class TaskNodeOffScreenElement extends SShapeElement implements LayoutContainer {
    static readonly DEFAULT_FEATURES = [boundsFeature];

    layout: string;
    layoutOptions?: { [key: string]: string | number | boolean };
    size = {
        width: 32,
        height: 32
    };
}

export function registerOffScreenModelElement(
    context: { bind: interfaces.Bind, isBound: interfaces.IsBound },
    type: string,
    constr: new () => SShapeElement,
    features?: CustomFeatures
): void {
    context.bind<OffScreenElementRegistration>(WORKFLOW_TYPES.OffScreenModelRegistration).toConstantValue({
        type, constr, features
    });
}

@injectable()
export class OffScreenModelRegistry extends FactoryRegistry<SShapeElement, void> {
    constructor(@multiInject(WORKFLOW_TYPES.OffScreenModelRegistration) @optional() registrations: OffScreenElementRegistration[]) {
        super();
        registrations.forEach(registration => {
            this.register(registration.type, () => new registration.constr());
        });
        console.log(registrations);
    }
}

export interface OffScreenElementRegistration {
    type: string
    constr: OffScreenElementConstructor
    features?: CustomFeatures
}

export interface OffScreenElementConstructor {
    DEFAULT_FEATURES?: ReadonlyArray<symbol>
    new (): SShapeElement
}
