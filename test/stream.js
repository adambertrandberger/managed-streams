const { expect } = require('chai');
const {
    Stream
} = require('../src/stream.js');

describe('Stream graph', () => {
    it('Can be connected linearly.', () => {
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
});
