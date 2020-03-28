const { BufferedChannel } = require('./buffered-channel.js');
const { TimeWindow } = require('./time-window.js');

class Stream {
    constructor(init={}) {
        if (typeof init === 'function') {
            init = {
                update: init
            };
        }
        this.update = init.update; // [a] => [b]

        this.sources = [];
        this.sink = null; // currently we only do unicast

        this.channel = new BufferedChannel();

        // each stream has an interval which is
        // the frequency (delay in ms per loop) in which to check the buffered channel
        this.interval = init.interval || 0;

        this.cancelled = false;
    }

    to(sink) {
        this.sink = sink;
        sink.sources.push(this);
    }

    // starts each node's polling process
    run() {
        this.forEach(x => x.poll());
    }

    // stops each node's polling process
    cancel() {
        this.forEach(x => {
            x.cancelled = true;
        });
    }

    // continuously poll at ~this.interval~
    poll() {
        this.cancelled = false;
        const loop = () => {
            setTimeout(async () => {
                await this.propagate();
                if (!this.cancelled) {
                    loop();
                }
            }, this.interval);
        };
        loop();
    }

    // wraps the ~this.update~ function -- for subclasses to do pre/post-processing
    async process(value) {
        // if the value is a event (almost always the case),
        // pass the update function the value, and create an information object
        // with metadata
        if (value instanceof Event) {
            const event = value;
            return await this.update(event.value, {
                from: event.from,
                deltaTime: event.deltaTime,
                interval: event.interval,
                time: event.time
            });            
        } else { // this will only be the case for a source (one that doesn't have any sources of its own)
            return await this.update(value);
        }
    }

    // takes data from the channel (if applicable)
    // and sends data to the sink (if applicable)
    async propagate() {
        // if this node is a source, don't check channel
        if (this.sources.length === 0) {
            if (this.sink === null) { // this is the only node in the network
                await this.process(Event.empty(this));
            } else {
                await this.output(this.process(Event.empty(this)));                    
            }
        } else if (this.sink !== null) {
            // if this is a node between a source and a sink,
            // get value from channel, process it, and relay it to the sink
            const value = await this.channel.get();
            await this.output(this.process(value));                    
        } else {
            // if this is a sink, get value from channel and run update
            // without propagating downstream (there is no downstream)
            const value = await this.channel.get();
            await this.process(value);                    
        }
    }

    // takes statistics on the value produced by the
    // given promise, then sends a event with the value to the sink
    async output(promise) {
        const startTime = new Date(),
              value = await promise,
              now = new Date(),
              event = new Event(value, this, now - startTime, startTime);
        this.sink.channel.put(event);
    }

    // maps a function over each node in the network
    forEach(f, skip=new Set()) {
        if (skip.has(this)) {
            return;
        }
        skip.add(this);
        f(this);
        this.sources.map(x => x.forEach(f, skip));
        if (this.sink !== null) {
            this.sink.forEach(f, skip);
        }
    }

    static lift(x, LiftType=Stream) {
        if (x instanceof Stream) {
            return x;
        } else if (typeof x === 'function') {
            return new LiftType({
                update: x
            });
        } else {
            return new LiftType({
                update: () => x
            });
        }
    }

    static seq(xs, LiftType=Stream) {
        const streams = xs.map(x => LiftType.lift(x, LiftType));
        for (var i=1; i<streams.length; ++i) {
            streams[i-1].to(streams[i]);
        }
        return streams[0];
    }
}

// a event is sent over the channel so that
// the downstream knows which stream sent the value
// and includes some statistic information
class Event {
    constructor(value, from, deltaTime, time=new Date()) {
        this.value = value; // the data
        this.from = from; // which stream produced this data
        this.deltaTime = deltaTime; // how long this data took to produce
        this.time = time; // when this data was produced (when it started)
        this.interval = from.interval; // the sample rate (in ms of delay) when this data was generated
    }

    static empty(from, deltaTime=0, time=new Date()) {
        return new Event(null, from, deltaTime, time);
    }
}

module.exports = {
    Stream
};
