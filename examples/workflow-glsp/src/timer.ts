/********************************************************************************
 * Copyright (c) 2019-2022 EclipseSource and others.
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

export class Timer {
    private timeSum = 0;
    private timesMeasured = 0;
    private lastStarted: number | undefined = undefined;
    private lastTime: number | undefined = undefined;

    startTimer(): void {
        if (this.lastStarted === undefined) {
            this.lastStarted = performance.now();
        }
        this.timesMeasured++;
        this.lastTime = performance.now();
    }
    endTimer(): void {
        const now = performance.now();
        if (this.lastStarted && this.lastTime) {
            const msPassed = now - this.lastStarted;

            if (msPassed > 5000) {
                this.lastStarted = undefined;
                console.log(
                    `Average rendering time during the last 5 seconds: ${this.timeSum / this.timesMeasured} ms (rendered ${
                        this.timesMeasured
                    } times)`
                );
                this.timeSum = 0;
                this.timesMeasured = 0;
            } else {
                this.timeSum += now - this.lastTime;
            }
        }
    }
}
