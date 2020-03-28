/*
 * A list of values that resets after the items have exceeded
 * their lifespan ~duration~.
 */
class TimeWindow {
    constructor(duration=1000) {
        this.duration = duration;
        this.values = [];
    }

    // adds a value to the window, filters out any old values
    add(value, time=new Date()) {
        this.values.push({ value, time });
        this.update(time);
    }

    // sets the window to the given list
    set(value, time=new Date()) {
        this.values = value.map(x => ({ value: x, time }));
        this.update(time);
    }

    // filters old values, then returns the values in the window
    get(time=new Date()) {
        this.update(time);
        return this.values.map(x => x.value);
    }

    // applies a reduction function to the values in the window
    reduce(f, initial=undefined, time=new Date()) {
        return this.get(time).reduce(f, initial);
    }

    // filters out old values from the window
    update(time=new Date()) {
        this.values = this.values.filter(x => time - x.time < this.duration);
    }
}

module.exports = {
    TimeWindow
};
