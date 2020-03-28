const { TimeWindow } = require('./time-window.js');
const { Stream } = require('./stream.js');

/*
 * Managed stream
 *
 * A Stream that takes batches as input, and generates them for output,
 * that has built-in metrics, and automatic update of sample rates.
 */
class MStream extends Stream {
    constructor(init) {
        super(init);

        // ~this.window~ is an array of the lengths of batches that have been processed in the last ~init.windowDuration~ ms
        this.window = new TimeWindow(init.windowDuration);

        // ~this.target~ is an upper bound on how many samples per second this node should process
        this.target = init.target || Infinity;
    }

    async process(message) {
        // if the previous stream wasn't using a list,
        // lift the value into a list
        if (message !== undefined) {
            message.value = liftIntoArray(message.value);
        }
        let value = await super.process(message);
        // MStream always takes batches (arrays) and always returns them,
        // so ensure the return value is an array
        value = liftIntoArray(value);
        // add the length of the returned batch to the window for counting throughput
        this.window.add(value.length);
        return value;
    }

    // target throughput is the minimum throughput of the ~sources~ and this node's ~this.target~
    // it is an upper bound on what this node's throughput should be
    getTargetThroughput() {
        // not all nodes have ~this.target~ defined (such as direct instances of Stream)
        // if that is the case, assume they are infinite
        return Math.min(this.target, ...this.sources.map(x => x.target === undefined ? Infinity : x.target));
    }

    // items that have been processed by this node per ~windowDuration~ (by default 1 second)
    getThroughput() {
        // sum the window
        return this.window.reduce((a, b) => {
            return a + b;
        }, 0);
    }

    static lift(x) {
        return super.lift(x, MStream);
    }
}

// lifts a value into an array
function liftIntoArray(x) {
    if (!Array.isArray(x)) {
        return [x];
    } else {
        return x;
    }
}

module.exports = {
    MStream
};
