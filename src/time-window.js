/*
 * A list of values that resets after the items have exceeded
 * their lifespan ~duration~.
 */
class TimeWindow {
    constructor(duration) {
        this.duration = duration;
        this.values = [];
    }

    add(value, time=new Date()) {
        this.value = value;
        this.values.push({ value, time });
        this.updateValues();
    }

    updateValues() {
        this.values = this.values.filter(x => new Date() - x.time < this.duration);
    }

    getValueCount() {
        return this.getValues().length;
    }

    getValues() {
        this.updateValues();
        return this.values.map(x => x.value);
    }
}

modules.export = {
    TimeWindow
};
