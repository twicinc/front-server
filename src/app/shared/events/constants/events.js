angular.module('EVENTS')
    .constant('events',{
        //LOGIN
        logged: 'logged',
        logout_call: 'logout_call',
        logout_success: 'logout_success',
        //NOTIFICATION
        notification_received : 'notification_received',
        //CONNECTIONS
        user_follow : 'user.follow',
        user_unfollow : 'user.unfollow',
        //USER
        user_updated : 'user.update',

        // POST
        post_commented: 'post.com',
        post_liked: 'post.like',
        post_updated: 'post.update',

        feed_updates: 'feed.hasupdates',

        //LAYOUT
        window_resized : 'window.resized',
        window_scrolled : 'window.scrolled'
    });
