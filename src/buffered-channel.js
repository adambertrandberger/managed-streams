/*
 * An implementation of CSP channels with a buffer using promises
 *
 * This implementation is sort of multi-cast in that if there are 
 * multiple blocked ~get~s, and a ~put~ is made, it will send the ~put~
 * value to all the blocked ~get~s. 
 */
class BufferedChannel {
    constructor() {
        this.buffer = [];
        this.subscribers = [];
    }

    put(value) {
        // if there are processes waiting on this value
        // send it without buffering it
        if (this.subscribers.length > 0) {
            while (this.subscribers.length > 0) {
                this.subscribers.pop()(value);
            }
        } else {
            // otherwise buffer it so future ~get~s can get the value
            this.buffer.unshift(value);
        }
    }

    get(value) {
        if (this.buffer.length > 0) {
            return Promise.resolve(this.buffer.pop());
        } else {
            return new Promise(resolve => {
                this.subscribers.push(resolve);
            });
        }
    }
}

module.exports = {
    BufferedChannel
};
