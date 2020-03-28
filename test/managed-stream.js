const { expect } = require('chai');
const {
    MStream
} = require('../src/managed-stream.js');

describe('MStream', () => {
    it('Can lift values.', () => {
        const mstream1 = MStream.lift(1),
              mstream2 = MStream.lift(x => x + 11);
        expect(mstream1.update()).to.equal(1);
        expect(mstream2.update(12)).to.equal(23);
    });

    it('Keeps track of throughput.', done => {
        let count = 0,
            mstream1 = MStream.lift(async () => {
                count += 2;
                return [Math.random(), Math.random()];
            });
        mstream1.run();
        setTimeout(() => {
            expect(count).to.eql(mstream1.getThroughput());
            mstream1.cancel();
            done();
        }, 20);
    });
});
