type Listener = (...args: any[]) => any;

export class EventEmitter {
    events: Record<string, Listener[]>;

    constructor() {
        this.events = {};
    }
    on(event: string, listener: Listener) {
        if (!(event in this.events)) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
        return () => this.removeListener(event, listener);
    }
    removeListener(event: string, listener: Listener) {
        if (!(event in this.events)) {
            return;
        }
        const idx = this.events[event].indexOf(listener);
        if (idx > -1) {
            this.events[event].splice(idx, 1);
        }
        if (this.events[event].length === 0) {
            delete this.events[event];
        }
    }
    emit(event: string, ...args: any[]) {
        if (!(event in this.events)) {
            return;
        }
        this.events[event].forEach(listener => listener(...args));
    }
    once(event: string, listener: Listener) {
        const remove = this.on(event, (...args) => {
            remove();
            listener(...args);
        });
    }
};