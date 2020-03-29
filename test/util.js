const { expect } = require('chai');
const {
    intervalToSampleRate,
    sampleRateToInterval
} = require('../src/util.js');

describe('Utility Functions', () => {
    it('Should accurately convert intervals to sample rates.', () => {
        // 1000ms per sample means 1 sample per second
        expect(intervalToSampleRate(1000)).to.equal(1);
        // 500ms per sample means 2 samples per second        
        expect(intervalToSampleRate(500)).to.equal(2);
        expect(intervalToSampleRate(0)).to.equal(Infinity);
    });

    it('Should accurately convert sample rates to intervals.', () => {
        // one time per second means 1000ms of delay per sample
        expect(sampleRateToInterval(1)).to.equal(1000);
        // two times per second means 500ms of delay per sample
        expect(sampleRateToInterval(2)).to.equal(500);
        expect(sampleRateToInterval(Infinity)).to.equal(0);                
    });
});
