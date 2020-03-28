const { expect } = require('chai');
const {
    BufferedChannel
} = require('../src/buffered-channel.js');

describe('Buffered Channel', () => {
    it('Returns the same value that is ~put~.', async () => {
        const chan = new BufferedChannel(),
              value = 23948;
        chan.put(value);
        const chanValue = await chan.get();
        expect(value).to.equal(chanValue);
    });
    it('Buffers values that have been ~put~ in FIFO ordering.', async () => {
        const chan = new BufferedChannel(),
              value1 = 9812,
              value2 = 1234,
              value3 = "awef";
        chan.put(value1);
        chan.put(value2);
        chan.put(value3);
        
        const chanValue1 = await chan.get(),
              chanValue2 = await chan.get(),
              chanValue3 = await chan.get();
        expect(value1).to.equal(chanValue1);
        expect(value2).to.equal(chanValue2);
        expect(value3).to.equal(chanValue3);                
    });
    it('Blocks until value is ~put~.', done => {
        const chan = new BufferedChannel();
        var value;
        chan.get().then(x => value = x);

        setTimeout(() => {
            expect(value).to.equal(undefined);
            chan.put(10);
            setTimeout(() => {
                expect(value).to.equal(10);
                done();
            }, 10);
        }, 10);
    });
    it('Multiple ~get~s can be run after another.', done => {
        const chan = new BufferedChannel();
        var get1,
            get2,
            get3;                
        const value1 = "oaiwefnvb23091038",
              value2 = "vmzb09309823i3",
              value3 = "mbvzpp2309813";
        
        chan.get().then(x => get1 = x);
        setTimeout(() => {
            expect(get1).to.equal(undefined);
            chan.put(value1);
            setTimeout(() => {
                chan.get().then(x => get2 = x); // next ~get~
                expect(get1).to.equal(value1);
                setTimeout(() => {
                    expect(get2).to.equal(undefined);
                    chan.put(value2);
                    setTimeout(() => {
                        chan.get().then(x => get3 = x); // next ~get~
                        expect(get2).to.equal(value2);
                        setTimeout(() => {
                            expect(get3).to.equal(undefined);                            
                            chan.put(value3);
                            setTimeout(() => {
                                expect(get3).to.equal(value3);
                                done();
                            }, 10);
                        }, 10);
                    }, 10);                    
                }, 10);                
            }, 10);
        }, 10);
    });
    it('Multiple blocked ~get~s recieve the same ~put~ value.', done => {
        const chan = new BufferedChannel();
        var get1;
        var get2;
        var get3;                
        chan.get().then(x => get1 = x);
        chan.get().then(x => get2 = x);
        chan.get().then(x => get3 = x);

        const value = "oawiefaowinv9823";

        setTimeout(() => {
            expect(get1).to.equal(undefined);
            expect(get2).to.equal(undefined);
            expect(get3).to.equal(undefined);                        
            chan.put(value);
            setTimeout(() => {
                expect(get1).to.equal(value);
                expect(get2).to.equal(value);
                expect(get3).to.equal(value);                                
                done();
            }, 10);
        }, 10);
    });
});
