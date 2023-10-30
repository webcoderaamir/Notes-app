var mongoose = require('mongoose');

var PostSchema = mongoose.Schema({
    postdets: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    like: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],
    date: {
        type: Date,
        default: Date.now
    },
})

module.exports = mongoose.model('post', PostSchema);