const msInASec = 1000;

// interval - delay (in ms) per sample
// sampleRate - samples per second
function intervalToSampleRate(interval) {
    return interval === 0 ? Infinity : msInASec / interval;
}

function sampleRateToInterval(sampleRate) {
    return sampleRate === Infinity ? 0 : msInASec / sampleRate;
}

module.exports = {
    intervalToSampleRate,
    sampleRateToInterval
};
