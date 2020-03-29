const { expect } = require('chai');
const {
    Stream
} = require('../src/stream.js');

describe('Stream', () => {
    it('Graph can be connected linearly.', () => {
        const a = new Stream(),
              b = new Stream(),
              c = new Stream();
        a.to(b);
        b.to(c);

        // check sinks
        expect(a.sink).to.equal(b);
        expect(b.sink).to.equal(c);
        expect(c.sink).to.equal(null);        

        // check sources
        expect(a.sources.length).to.equal(0);
        expect(b.sources[0]).to.equal(a);
        expect(c.sources[0]).to.equal(b);         
    });

    it('Nodes can have multiple sources.', () => {
        const a = new Stream(),
              b = new Stream(),
              c = new Stream(),
              d = new Stream(),
              e = new Stream();
        a.to(d);
        b.to(d);        
        c.to(d);
        d.to(e);

        // check sinks
        expect(a.sink).to.equal(d);
        expect(b.sink).to.equal(d);
        expect(c.sink).to.equal(d);                
        expect(d.sink).to.equal(e);
        expect(e.sink).to.equal(null);        

        // check sources
        expect(a.sources.length).to.equal(0);
        expect(b.sources.length).to.equal(0);
        expect(c.sources.length).to.equal(0);                
        expect(d.sources.length).to.equal(3);
        expect(d.sources.includes(a)).to.equal(true);
        expect(d.sources.includes(b)).to.equal(true);
        expect(d.sources.includes(c)).to.equal(true);                        
        expect(e.sources[0]).to.equal(d);         
    });

    it('Can lift values.', () => {
        const stream1 = Stream.lift(1),
              stream2 = Stream.lift(() => "alpha"),
              stream3 = Stream.lift(x => x + 10);
        expect(stream1.update()).to.equal(1);
        expect(stream2.update()).to.equal("alpha");
        expect(stream3.update(23)).to.equal(33);                
    });

    it('Can be sequenced.', () => {
        const stream1 = new Stream(),
              stream2 = new Stream(),
              stream3 = new Stream(),
              stream4 = new Stream(),
              seqStream1 = Stream.seq([stream1, stream2]),              
              seqStream2 = Stream.seq([stream1, stream2, stream3]),
              seqStream3 = Stream.seq([stream1, stream2, stream3, stream4]);

        // seqStream1
        expect(seqStream1.sources).to.eql([]);
        expect(seqStream1.sink).to.eql(stream2);

        // seqStream2
        expect(seqStream2.sources).to.eql([]);
        expect(seqStream2.sink).to.eql(stream2);
        expect(seqStream2.sink.sink).to.eql(stream3);

        // seqStream3
        expect(seqStream3.sources).to.eql([]);
        expect(seqStream3.sink).to.eql(stream2);
        expect(seqStream3.sink.sink).to.eql(stream3);        
        expect(seqStream3.sink.sink.sink).to.eql(stream4);
    });

    it('Can iterate over each node once with ~this.forEach~.', () => {
        const stream1 = new Stream(),
              stream2 = new Stream(),
              stream3 = new Stream(),
              stream4 = new Stream(),
              allNodes = new Set([stream1, stream2, stream3, stream4]);
        stream1.to(stream3);
        stream2.to(stream3);
        stream3.to(stream4);
        const nodes = new Set();
        stream1.forEach(node => {
            nodes.add(node);
        });
        expect(setEqual(nodes, allNodes)).to.equal(true);
    });
});

// tests equality for Set objects
function setEqual(set1, set2) {
    for (const item of set1) {
        if (!set2.has(item)) {
            return false;
        }
    }
    return true;
}
