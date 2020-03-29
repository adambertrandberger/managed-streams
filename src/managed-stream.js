const { TimeWindow } = require('./time-window.js');
const { Stream } = require('./stream.js');

/*
 * Managed stream
 *
 * A Stream that takes batches as input,
 * that has built-in metrics, and automatic update of sample rates.
 */
class MStream extends Stream {
    constructor(init) {
        super(init);

        // ~this.window~ is an array of the lengths of batches that have been processed in the last ~init.windowDuration~ ms
        this.window = new TimeWindow(init.windowDuration);

        // ~this.target~ is an upper bound on how many samples per second this node should process
        this.target = init.target || Infinity;

        /*
         * control channels
         * each stream should have a control channel with an interval of 0
         * the messages sent to them should have the logic for the elastic behavior
         * like how long to wait until evaluating the throughput again
         */
    }

    async process(event) {
        // if the previous stream wasn't using a batch (this means it wasn't a MStream),
        // lift the value into a batch
        let effectiveSize = null,
            value = null;
        if (event !== undefined) { // if the event is undefined, that means this node is a source
            if (!(event.value instanceof Batch)) {
                event.value = Batch.lift(event.value);
            }
            // pass on the value of effectiveSize
            effectiveSize = event.value.effectiveSize;
            value = await super.process(event.value.items);
        } else {
            value = await super.process();
            // if this is a source, set the effectiveSize instead of just passing the value along            
            effectiveSize = liftIntoArray(value).length;
        }
        
        // add how many items this computation represented to the moving window count (for calculating throughput later)
        this.window.add(effectiveSize);

        // if this MStream is connected to another MStream, send it a new batch
        // if it is connected to a normal Stream, just send the value
        if (this.sink !== null) {
            if (this.sink instanceof MStream) {
                // propagate the effectiveSize in a new batch (effectiveSize should never change after it has been initially set)
                return new Batch(value, effectiveSize);
            } else {
                return value;                
            }
        }
        return value;
    }
    
    // this node subceeds the target throughput if its throughput is less than
    // its ~source~s target throughputs or this node's target throughput
    isSubceedingThroughput() {
        return this.getThroughput() < this.getTargetThroughput();
    }

    // this node exceeds the target throughput if its throughput is higher than
    // its ~source~s target throughputs or this node's target throughput
    isExceedingThroughput() {
        return this.getThroughput() > this.getTargetThroughput();
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

class Batch {
    constructor(items, effectiveSize) {
        this.items = items;

        // effectiveSize is how many samples this batch represents
        // ~this.items.length~ might only be 1, but if the computation
        // that generated this batch had to go through 1000 items to produce
        // that value, that one value represents 1000 items.
        //
        // effectiveSize should only be set for source nodes
        // then each node that follows should just pass the same effectiveSize
        // along
        this.effectiveSize = effectiveSize;
    }

    static lift(x) {
        const arr = liftIntoArray(x);
        return new Batch(arr, arr.length);
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
