const { BufferedChannel } = require('./buffered-channel.js');

class Stream {
    constructor(init={}) {
        this.update = init.update; // [a] => [b]

        this.sources = [];
        this.sink = null; // currently we only do unicast

        this.channel = new BufferedChannel();

        // each stream has an interval which is
        // the frequency (delay in ms per loop) in which to check the buffered channel
        this.interval(init.interval || 0)
        // windowDuration is for keeping throughput statistics it is the period of time
        // to tally up how many items we have processed
            .windowDuration(init.window || 1000);
    }

    to(sink) {
        this.sink = sink;
        sink.sources.push(this);
    }

    // starts each node's polling process
    run() {
        this.forEach(x => x.poll());
    }

    // continuously poll at ~this.interval~
    poll() {
        const loop = () => {
            setTimeout(async () => {
                await this.propagate();
                loop();
            }, this.interval);
        };
        loop();
    }

    // takes data from the channel (if applicable)
    // and sends data to the sink (if applicable)
    async propagate() {
        // if this node is a source, don't check channel
        if (this.sources.length === 0) {
            this.sink.channel.put(await this.update());                    
        } else if (this.sink !== null) {
            // if this is a node between a source and a sink,
            // get value from channel, process it, and relay it to the sink
            const value = await this.channel.get();
            this.sink.channel.put(await this.update(value));                    
        } else {
            // if this is a sink, get value from channel and run update
            // without propagating downstream (there is no downstream)
            const value = await this.channel.get();
            await this.update(value);                    
        }
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

    interval(interval) {
        this.interval = interval;
        return this;
    }

    windowDuration(duration) {
        this.window = new TimeWindow(duration);
        return this;
    }

    static lift(x) {
        if (x instanceof Stream) {
            return x;
        } else if (typeof x === 'function') {
            return new Stream({
                update: x
            });
        } else {
            return new Stream({
                update: () => x
            });
        }
    }

    static seq(xs) {
        const streams = xs.map(Stream.lift);
        for (var i=1; i<streams.length; ++i) {
            streams[i-1].to(streams[i]);
        }
        return streams[0];
    }
}

class Batch {
    constructor(items) {
        this.items = items;
    }
}

module.exports = {
    Stream
};
