const { expect } = require('chai');
const {
    TimeWindow
} = require('../src/time-window.js');

describe('Time Window', () => {
    it('Can store values.', () => {
        const w = new TimeWindow(1000);
        w.add(1);
        w.add(2);
        w.add(3);
        expect(w.get()).to.eql([1, 2, 3]);
    });

    it('Phases out values that have expired.', () => {
        const w = new TimeWindow(1000),
              now = new Date();
        w.add('a', now);
        w.add('b', later(now, 500));
        w.add('c', later(now, 1000));
        expect(w.get(later(now, 1000))).to.eql(['b', 'c']);        
    });
    
    it('Works with different window durations.', () => {
        const w = new TimeWindow(2500),
              now = new Date();
        w.add('a', now);
        w.add('b', later(now, 500));
        w.add('c', later(now, 1000));
        w.add('d', later(now, 1500));
        w.add('e', later(now, 2000));
        w.add('f', later(now, 2500));
        w.add('g', later(now, 3000));                                
        expect(w.get(later(now, 3000))).to.eql(['c', 'd', 'e', 'f', 'g']);        
    });

    it('Can be reduced.', () => {
        const w = new TimeWindow(1000),
              value1 = [1,2,3],
              value2 = [5,4,3,5],
              value3 = [20,30,40,32,1,2,3];
        w.add(value1);
        w.add(value2);
        w.add(value3);
        expect(w.reduce((a, b) => {
            return a + b.length;
        }, 0)).to.equal([value1, value2, value3].reduce((a, b) => {
            return a + b.length;
        }, 0));
    });
});

function later(date, ms) {
    return new Date(date.getTime() + ms);
}
