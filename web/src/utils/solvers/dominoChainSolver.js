// ══════════════════════════════════════════════════════════════════════════════
// REALIS DominoChainPhysicsSolver — Rigid-Body Domino Chain Reaction Engine
// Models a planar chain of rectangular dominoes rotating about their base.
// Each domino is a rigid body with moment of inertia I = (1/3) m H² about bottom edge.
// Gravity torque: τ = -m g (H/2) sin(θ)  (for small angles, or full: τ = -m g (H/2) sin(θ) cos(φ)?)
// Actually for a rectangle rotating about bottom edge:
//   Center of mass at H/2 from base. Torque = r × F = (H/2) * mg * sin(θ) where θ is angle from vertical.
//   When θ=0 (upright), torque=0. When θ=90° (flat), torque = mg(H/2).
//   Equation: I θ'' = -mg(H/2) sin(θ)  (restoring toward θ=0... wait)
//   If θ is measured from vertical (upright = 0), then when domino leans right (positive θ),
//   gravity pulls it further right. Torque = +mg(H/2) sin(θ). Unstable equilibrium at θ=0.
//   But we measure θ from horizontal? Let's define θ = angle from horizontal ground.
//   Upright = 90° (π/2). Flat on ground = 0° or π.
//   Center of mass height = (H/2) sin(θ) above ground? No, if base at y=0, CM at (H/2)sin(θ) for angle from horizontal.
//   Actually if θ is angle from horizontal: upright = π/2, lying flat = 0 or π.
//   Torque about base: τ = r × F = (H/2) * mg * cos(θ) for θ from horizontal?
//   Let's use: θ = angle from VERTICAL (upright = 0). This is standard inverted pendulum.
//   CM position: x = (H/2) sin(θ), y = (H/2) cos(θ)
//   Gravity force: Fg = (0, -mg)
//   Torque: τ = r × F = x*Fy - y*Fx = (H/2) sin(θ) * (-mg) - (H/2) cos(θ) * 0 = -mg(H/2) sin(θ)
//   For small θ > 0 (leaning right), τ < 0, which accelerates toward negative? Wait.
//   If θ > 0 means leaning right (clockwise), then sin(θ) > 0, τ = -mg(H/2)sin(θ) < 0.
//   But negative torque would mean counter-clockwise (restoring). That's wrong for inverted pendulum.
//   Actually: if θ is angle from vertical, positive = right lean, gravity torque should be POSITIVE (accelerating right).
//   r = (H/2 sin(θ), H/2 cos(θ)), F = (0, -mg)
//   τ = r_x * F_y - r_y * F_x = (H/2 sin(θ)) * (-mg) - (H/2 cos(θ)) * 0 = -mg(H/2) sin(θ)
//   So τ is negative for positive θ. But if we define positive θ as clockwise, then τ should be positive.
//   Let's just define: θ = angle from vertical, positive = clockwise (falling right).
//   Then CM is at x = (H/2) sin(θ), y = (H/2) cos(θ).
//   Torque about base (z out of page): τ = r × F = x*Fy - y*Fx = (H/2 sin(θ))*(-mg) - (H/2 cos(θ))*0 = -mg(H/2) sin(θ)
//   If θ > 0, sin(θ) > 0, τ < 0 (counter-clockwise). This is RESTORING toward upright.
//   That's correct for a NORMAL pendulum hanging DOWN. For an INVERTED pendulum (domino upright),
//   the CM is ABOVE the pivot, so r = (0, H/2) when upright. For small right lean, CM is at x > 0.
//   Gravity pulls DOWN, creating clockwise torque. So τ should be POSITIVE.
//   The issue is coordinate system. Let's use y UP. Then Fg = (0, -mg). r = (H/2 sin(θ), H/2 cos(θ)).
//   τ = r_x F_y - r_y F_x = (H/2 sin(θ))*(-mg) - 0 = -mg(H/2) sin(θ).
//   If θ is small positive (right lean), τ < 0 (into page = counter-clockwise). But gravity should cause clockwise fall.
//   Ah! The cross product in 2D: τ = x*Fy - y*Fx. With y UP, Fy = -mg.
//   τ = x*(-mg) = -(H/2) sin(θ) * mg. For θ>0, sin(θ)>0, τ<0.
//   But in standard 2D with y UP, positive torque is OUT OF PAGE (counter-clockwise).
//   Clockwise is negative. So for right lean (θ>0), gravity produces clockwise (negative) torque. Correct!
//   So equation: I θ'' = -mg(H/2) sin(θ)  where positive θ = right lean, positive torque = CCW.
//   But we want θ to increase as it falls right (clockwise). So let's define:
//   θ = angle from vertical, POSITIVE = CLOCKWISE (falling right).
//   Then CM: x = (H/2) sin(θ), y = (H/2) cos(θ)  [y up]
//   Fg = (0, -mg)
//   τ = r_x F_y - r_y F_x = (H/2 sin(θ))*(-mg) = -mg(H/2) sin(θ)
//   For θ > 0, τ < 0. But if positive θ = clockwise, then positive τ = CCW.
//   So τ is negative (clockwise) for positive θ. But the equation has τ = I θ''.
//   So I θ'' = -mg(H/2) sin(θ). For small θ, θ'' = -(mgH/2I) θ. This is RESTORING.
//   That's WRONG for inverted pendulum. Inverted pendulum has UNSTABLE equilibrium.
//   
//   The fix: For inverted pendulum, the torque is τ = +mg(H/2) sin(θ).
//   Where does the sign flip come from? 
//   If pivot at bottom, CM ABOVE pivot. r = (0, H/2) at θ=0. For small right lean, r = (+small, H/2).
//   F = (0, -mg). Torque = r × F = x*Fy - y*Fx = (+small)*(-mg) - (H/2)*0 = -small*mg < 0.
//   In standard coords (x right, y up), negative torque = clockwise. So it ACCELERATES clockwise.
//   So τ = -mg(H/2) sin(θ). For θ>0, τ<0 (clockwise). If we define positive θ as clockwise, then θ'' = τ/I = -mg(H/2)I sin(θ).
//   But if positive θ is clockwise, then θ increases as it falls. And τ is negative (also clockwise).
//   So both θ and τ are negative in standard math convention? No.
//   
//   Let's just use: θ = angle from vertical. θ = 0 upright. θ increases as it falls RIGHT (clockwise).
//   Then I = (1/3) m H².
//   Torque from gravity: τ = +mg(H/2) sin(θ)  (positive = clockwise = falling direction).
//   This gives: θ'' = (3g/2H) sin(θ).
//   For small θ: θ'' ≈ (3g/2H) θ. Positive feedback → exponential growth (unstable).
//   That's correct for inverted pendulum!
//   
//   So the equation is: θ'' = (3g / 2H) sin(θ)
//   
//   Contact model: When domino i's top corner hits domino i+1.
//   Domino i: base at x_i, height H, thickness T.
//   Top right corner when at angle θ: x = x_i + T/2 + H sin(θ), y = H cos(θ) (for small θ)
//   Actually for a rectangle rotating about bottom center:
//   Bottom center at (x_i, 0). Width = T (thickness), Height = H.
//   Top right corner: x = x_i + (T/2) cos(θ) + H sin(θ)? 
//   Let's set up: domino base center at (x_i, 0). Upright: extends from x_i - T/2 to x_i + T/2, y from 0 to H.
//   Rotate by θ about base center (x_i, 0).
//   Top right corner initial: (x_i + T/2, H). After rotation by θ (clockwise positive):
//   x = x_i + (T/2) cos(θ) + H sin(θ)
//   y = H cos(θ) - (T/2) sin(θ)
//   
//   Domino i+1 base at x_{i+1} = x_i + T + spacing.
//   It gets hit when domino i's top right corner x >= x_{i+1} - T/2 (left face of next domino).
//   And y of contact point is within height of domino i+1.
//   
//   Simplified: contact when x_i + T/2 + H sin(θ) >= x_{i+1} - T/2
//   → H sin(θ) >= spacing
//   → sin(θ) >= spacing / H
//   → θ_contact = arcsin(spacing / H)  (if spacing < H)
//   
//   Upon contact, we transfer angular momentum/impulse. Simplified:
//   Domino i imparts impulse to domino i+1, giving it initial angular velocity.
//   We'll use a simple coefficient of restitution model.
// ══════════════════════════════════════════════════════════════════════════════

const HISTORY_CAP = 5000;
const SUBSTEPS = 4;

export const DOMINO_STATES = {
    STANDING: 'STANDING',
    LEANING: 'LEANING', 
    FALLING: 'FALLING',
    CONTACT: 'CONTACT',
    FALLEN: 'FALLEN'
};

export class DominoChainPhysicsSolver {
    constructor(config = {}) {
        this.config = {
            // Chain
            count: config.count ?? 12,
            spacing: config.spacing ?? 0.03,      // gap between dominoes (m)
            
            // Geometry
            height: config.height ?? 0.10,        // H (m)
            width: config.width ?? 0.04,          // W (depth, m) - not used in 2D
            thickness: config.thickness ?? 0.006, // T (m)
            
            // Physical
            mass: config.mass ?? 0.05,            // kg per domino
            gravity: config.gravity ?? 9.81,      // m/s²
            friction: config.friction ?? 0.1,     // base friction torque coefficient
            restitution: config.restitution ?? 0.15, // collision restitution
            
            // Initial conditions
            initialAngle: config.initialAngle ?? 0.0,      // rad (from vertical)
            initialOmega: config.initialOmega ?? 0.0,      // rad/s
            initialPushDomino: config.initialPushDomino ?? 0, // index of first pushed
            
            // Integration
            dt: config.dt ?? 0.005,
            timeScale: config.timeScale ?? 1.0,
            strobeInterval: config.strobeInterval ?? 0.05,
        };
        this.validateConfig();
        this.reset();
    }

    validateConfig() {
        const { count, spacing, height, thickness, mass, gravity } = this.config;
        if (count < 2) this.config.count = 2;
        if (spacing < 0) this.config.spacing = 0;
        if (height <= 0) this.config.height = 0.1;
        if (thickness <= 0) this.config.thickness = 0.006;
        if (mass <= 0) this.config.mass = 0.05;
        if (gravity < 0) this.config.gravity = 9.81;
        if (this.config.initialPushDomino >= this.config.count) {
            this.config.initialPushDomino = this.config.count - 1;
        }
        if (this.config.initialPushDomino < 0) this.config.initialPushDomino = 0;
    }

    reset() {
        const n = this.config.count;
        const { initialAngle, initialOmega, initialPushDomino } = this.config;
        
        this.time = 0.0;
        
        // Per-domino state
        this.theta = new Array(n).fill(initialAngle);
        this.omega = new Array(n).fill(initialOmega);
        this.alpha = new Array(n).fill(0);
        this.state = new Array(n).fill(DOMINO_STATES.STANDING);
        
        // Give initial push to first domino
        if (initialOmega !== 0 || initialAngle !== 0) {
            this.state[initialPushDomino] = DOMINO_STATES.FALLING;
        }
        
        // Contact tracking
        this.contactEvents = []; // { time, fromIdx, toIdx }
        this.fallenCount = 0;
        this.firstActivatedTime = null;
        this.lastActivatedIdx = -1;
        
        // Energy tracking
        this.initialEnergy = this.computeTotalEnergy();
        
        // History
        this.strobeHistory = [];
        this.lastStrobeTime = -Infinity;
        this.history = { 
            t: [], 
            fallenCount: [], 
            activeIndex: [],
            totalKE: [], 
            totalPE: [], 
            totalEnergy: [],
            propagationSpeed: []
        };
        this.recordPoint();
    }

    updateConfig(newConfig = {}) {
        const old = this.config;
        const geoKeys = ['count', 'spacing', 'height', 'width', 'thickness', 'mass'];
        const motionKeys = ['initialAngle', 'initialOmega', 'initialPushDomino'];
        
        const needsReset = [...geoKeys, ...motionKeys].some(k => 
            newConfig[k] !== undefined && newConfig[k] !== old[k]
        );
        
        this.config = { ...old, ...newConfig };
        this.validateConfig();
        
        if (needsReset) this.reset();
    }

    // Moment of inertia about bottom edge: I = (1/3) m H²
    get momentOfInertia() {
        return (1/3) * this.config.mass * this.config.height * this.config.height;
    }

    // Gravitational torque: τ = mg(H/2) sin(θ) (positive = clockwise = falling)
    computeGravityTorque(theta) {
        const { mass, gravity, height } = this.config;
        return mass * gravity * (height / 2) * Math.sin(theta);
    }

    // Friction torque (opposing motion)
    computeFrictionTorque(omega) {
        const { friction } = this.config;
        return -friction * omega;
    }

    // Contact detection: when does domino i hit domino i+1?
    // Returns contact angle threshold
    getContactAngle() {
        const { spacing, height, thickness } = this.config;
        // Simplified: contact when top corner reaches next domino's left face
        // x_i + T/2 + H sin(θ) >= x_{i+1} - T/2
        // x_{i+1} = x_i + T + spacing
        // → T/2 + H sin(θ) >= T + spacing - T/2 = spacing
        // → H sin(θ) >= spacing
        // → sin(θ) >= spacing / H
        const ratio = spacing / height;
        if (ratio >= 1) return Math.PI / 2; // Never contacts (falls flat first)
        return Math.asin(ratio);
    }

    // Energy calculations
    computeDominoEnergy(i) {
        const { mass, gravity, height } = this.config;
        const theta = this.theta[i];
        const omega = this.omega[i];
        const I = this.momentOfInertia;
        
        // CM height = (H/2) cos(θ) (θ from vertical, upright = 0, cos(0)=1)
        const cmHeight = (height / 2) * Math.cos(theta);
        const pe = mass * gravity * cmHeight;
        const ke = 0.5 * I * omega * omega;
        return { ke, pe, total: ke + pe };
    }

    computeTotalEnergy() {
        let totalKE = 0, totalPE = 0;
        for (let i = 0; i < this.config.count; i++) {
            const e = this.computeDominoEnergy(i);
            totalKE += e.ke;
            totalPE += e.pe;
        }
        return { kinetic: totalKE, potential: totalPE, total: totalKE + totalPE };
    }

    // Main simulation step
    step(deltaSeconds) {
        const dt = Math.min(deltaSeconds || this.config.dt, 0.05) * this.config.timeScale;
        const subDt = dt / SUBSTEPS;
        const n = this.config.count;
        const contactAngle = this.getContactAngle();
        
        for (let s = 0; s < SUBSTEPS; s++) {
            // Update each domino
            for (let i = 0; i < n; i++) {
                if (this.state[i] === DOMINO_STATES.FALLEN) continue;
                
                // Compute angular acceleration
                const gravityTorque = this.computeGravityTorque(this.theta[i]);
                const frictionTorque = this.computeFrictionTorque(this.omega[i]);
                const netTorque = gravityTorque + frictionTorque;
                
                this.alpha[i] = netTorque / this.momentOfInertia;
                
                // Semi-implicit Euler
                this.omega[i] += this.alpha[i] * subDt;
                this.theta[i] += this.omega[i] * subDt;
                
                // State transitions
                if (this.state[i] === DOMINO_STATES.STANDING) {
                    if (Math.abs(this.theta[i]) > 0.001 || Math.abs(this.omega[i]) > 0.001) {
                        this.state[i] = DOMINO_STATES.FALLING;
                        if (this.firstActivatedTime === null) {
                            this.firstActivatedTime = this.time;
                        }
                        this.lastActivatedIdx = i;
                    }
                }
                
                // Contact detection with next domino
                if (i < n - 1 && this.state[i] === DOMINO_STATES.FALLING) {
                    if (this.theta[i] >= contactAngle && this.state[i+1] === DOMINO_STATES.STANDING) {
                        this.triggerContact(i, i+1);
                    }
                }
                
                // Fallen detection (flat on ground)
                if (this.state[i] === DOMINO_STATES.FALLING && this.theta[i] >= Math.PI / 2 - 0.01) {
                    this.state[i] = DOMINO_STATES.FALLEN;
                    this.theta[i] = Math.PI / 2;
                    this.omega[i] = 0;
                    this.alpha[i] = 0;
                    this.fallenCount++;
                }
            }
            
            this.time += subDt;
        }
        
        // Strobe record
        if (this.time - this.lastStrobeTime >= this.config.strobeInterval) {
            this.recordPoint();
        }
    }

    triggerContact(fromIdx, toIdx) {
        // Simple impulse transfer: give next domino initial angular velocity
        // based on impacting domino's angular velocity and restitution
        const omegaTransfer = Math.abs(this.omega[fromIdx]) * this.config.restitution;
        this.omega[toIdx] = omegaTransfer;
        this.state[toIdx] = DOMINO_STATES.FALLING;
        this.lastActivatedIdx = toIdx;
        
        this.contactEvents.push({
            time: this.time,
            fromIdx,
            toIdx,
            transferOmega: omegaTransfer
        });
    }

    recordPoint() {
        const energy = this.computeTotalEnergy();
        
        // Find current active domino (largest omega among non-fallen)
        let activeIdx = -1;
        let maxOmega = 0;
        for (let i = 0; i < this.config.count; i++) {
            if (this.state[i] === DOMINO_STATES.FALLING && Math.abs(this.omega[i]) > maxOmega) {
                maxOmega = Math.abs(this.omega[i]);
                activeIdx = i;
            }
        }
        
        // Propagation speed
        let propSpeed = 0;
        if (this.contactEvents.length > 0 && this.firstActivatedTime !== null) {
            const lastEvent = this.contactEvents[this.contactEvents.length - 1];
            const distance = (lastEvent.toIdx + 1) * (this.config.thickness + this.config.spacing);
            const elapsed = lastEvent.time - this.firstActivatedTime;
            if (elapsed > 0) propSpeed = distance / elapsed;
        }
        
        this.strobeHistory.push({
            time: this.time,
            theta: [...this.theta],
            omega: [...this.omega],
            alpha: [...this.alpha],
            state: [...this.state],
            fallenCount: this.fallenCount,
            activeIndex: activeIdx,
            propSpeed
        });
        if (this.strobeHistory.length > HISTORY_CAP) {
            this.strobeHistory.splice(0, this.strobeHistory.length - HISTORY_CAP);
        }
        
        // Compact parallel history
        const h = this.history;
        h.t.push(this.time);
        h.fallenCount.push(this.fallenCount);
        h.activeIndex.push(activeIdx);
        h.totalKE.push(energy.kinetic);
        h.totalPE.push(energy.potential);
        h.totalEnergy.push(energy.total);
        h.propagationSpeed.push(propSpeed);
        if (h.t.length > HISTORY_CAP) {
            const cut = h.t.length - HISTORY_CAP;
            Object.keys(h).forEach(k => h[k].splice(0, cut));
        }
        
        this.lastStrobeTime = this.time;
    }

    getSnapshot() {
        const energy = this.computeTotalEnergy();
        const energyErrorPct = this.initialEnergy !== 0
            ? Math.abs((energy.total - this.initialEnergy) / this.initialEnergy) * 100
            : 0;
        
        // Find active domino
        let activeIdx = -1;
        let maxOmega = 0;
        for (let i = 0; i < this.config.count; i++) {
            if (this.state[i] === DOMINO_STATES.FALLING && Math.abs(this.omega[i]) > maxOmega) {
                maxOmega = Math.abs(this.omega[i]);
                activeIdx = i;
            }
        }
        
        // Propagation speed
        let propSpeed = 0;
        if (this.contactEvents.length > 0 && this.firstActivatedTime !== null) {
            const lastEvent = this.contactEvents[this.contactEvents.length - 1];
            const distance = (lastEvent.toIdx + 1) * (this.config.thickness + this.config.spacing);
            const elapsed = lastEvent.time - this.firstActivatedTime;
            if (elapsed > 0) propSpeed = distance / elapsed;
        }
        
        return {
            time: Number(this.time.toFixed(3)),
            count: this.config.count,
            fallenCount: this.fallenCount,
            activeIndex: activeIdx,
            firstActivatedTime: this.firstActivatedTime,
            lastActivatedIdx: this.lastActivatedIdx,
            propagationSpeed: Number(propSpeed.toFixed(4)),
            theta: this.theta.map(t => Number(t.toFixed(4))),
            thetaDeg: this.theta.map(t => Number((t * 180 / Math.PI).toFixed(2))),
            omega: this.omega.map(w => Number(w.toFixed(4))),
            alpha: this.alpha.map(a => Number(a.toFixed(4))),
            state: [...this.state],
            contactEvents: this.contactEvents.map(e => ({
                time: Number(e.time.toFixed(3)),
                fromIdx: e.fromIdx,
                toIdx: e.toIdx
            })),
            // Per-domino positions for rendering
            positions: this.theta.map((th, i) => {
                const x = i * (this.config.thickness + this.config.spacing);
                const T = this.config.thickness;
                const H = this.config.height;
                // Base center at x, bottom at y=0
                // Top right corner:
                const topX = x + (T/2) * Math.cos(th) + H * Math.sin(th);
                const topY = H * Math.cos(th) - (T/2) * Math.sin(th);
                // Top left corner:
                const topLeftX = x - (T/2) * Math.cos(th) + H * Math.sin(th);
                const topLeftY = H * Math.cos(th) + (T/2) * Math.sin(th);
                // Bottom corners:
                const botRightX = x + (T/2) * Math.cos(th);
                const botRightY = -(T/2) * Math.sin(th);
                const botLeftX = x - (T/2) * Math.cos(th);
                const botLeftY = (T/2) * Math.sin(th);
                return {
                    baseX: Number(x.toFixed(4)),
                    baseY: 0,
                    angle: Number(th.toFixed(4)),
                    angleDeg: Number((th * 180 / Math.PI).toFixed(2)),
                    corners: {
                        bl: { x: Number(botLeftX.toFixed(4)), y: Number(botLeftY.toFixed(4)) },
                        br: { x: Number(botRightX.toFixed(4)), y: Number(botRightY.toFixed(4)) },
                        tr: { x: Number(topX.toFixed(4)), y: Number(topY.toFixed(4)) },
                        tl: { x: Number(topLeftX.toFixed(4)), y: Number(topLeftY.toFixed(4)) }
                    }
                };
            }),
            // Energy
            energy: {
                kinetic: Number(energy.kinetic.toFixed(6)),
                potential: Number(energy.potential.toFixed(6)),
                total: Number(energy.total.toFixed(6)),
                initialTotal: Number(this.initialEnergy.toFixed(6)),
                errorPct: Number(energyErrorPct.toExponential(2))
            },
            // Config for validation
            config: { ...this.config },
            // History for graphs
            strobeHistory: this.strobeHistory,
            history: this.history
        };
    }
}

export default DominoChainPhysicsSolver;