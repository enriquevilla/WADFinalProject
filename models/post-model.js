const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
    song: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    description: {
        type: String,
        required: true
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "comments",
    }]
});

const postModel = mongoose.model("posts", postSchema);

const Posts = {
    createPost : function(newPost){
        return postModel
            .create(newPost)
            .then( post => {
                return post;
            })
            .catch( err => {
                throw new Error(err.message);
            }); 
    },
    getAllPosts: function() {
        return postModel
            .find()
            .populate("user", "userName")
            .populate("comments", ["comment", "username", "approved"])
            .then(posts => {
                return posts;
            })
            .catch(err => {
                throw new Error(err.message);
            })
    },
    getPostsByFollowing: async function(following) {
        // following = object ids
        let allResults = [];
        for (let ObjectId of following) {
            const postsByUser = await postModel.find({user: ObjectId})
                                                .then(posts => {return posts})
                                                .catch(err => {throw new Error(err.message)});
            for (let post of postsByUser) {
                allResults += post;
            }
        }
        return allResults;
    },
    updatePostComments: function(postID, commentID) {
        return postModel
            .updateOne({_id: postID}, {$push: {"comments": commentID}})
            .then(_ => {
                return this.getPostAfterUpdate(postID)
            })
            .catch(err => {
                throw new Error(err.message);
            })
    },
    getPostAfterUpdate: function(postID) {
        return postModel
            .findOne({_id: postID})
            .populate("comments", ["comment", "username", "approved"])
            .then(post => {
                return post;
            })
            .catch(err => {
                throw new Error(err.message);
            });
    },
    getPostsByUserID: function(userId){
        return postModel
            .find({user: userId})
            .populate("comments", ["comment", "username", "approved"])
            .populate("user", ["userName"])
            .then(users =>{
                return users;
            })
            .catch(err => {
                throw new Error(err.message);
            });
    },
    deleteOwnPosts: function(userId, postId){
        return postModel
            .findOneAndDelete({_id:postId})
            .then(removed=>{
                console.log("result", removed);
                if(removed==null){
                    throw new Error();
                }
                return "Deleted";
            })
            .catch( err => {
                throw new Error( err );
            });
    },
    getPostByID: function(postID) {
        return postModel
            .findOne({_id: postID})
            .then(post => {
                return post;
            })
            .catch(err => {
                throw new Error(err.message);
            })
    },
    getPostsByUsername: function(username) {
        return postModel
            .find()
            .populate("user", "userName")
            .then(posts => {
                return posts;
            })
            .catch(err => {
                throw new Error(err.message);
            })
    }
}

module.exports = {
    Posts
}