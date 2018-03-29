angular.module('page').controller('page_users_controller',
    [ 'page',  'users', '$q', 'user_model',  'page_users',  'pages_constants', 'notifier_service',
         'events_service', 'community_service','user_profile', '$timeout', 'pages_config', '$translate',
         'social_service',
        function( page, users, $q, user_model, page_users, pages_constants, notifier_service,
            events_service, community,  user_profile, $timeout, pages_config, $translate, social_service){

            var ctrl = this;
            ctrl.page = page;
            ctrl.users = users;
            ctrl.page_users = page_users;
            ctrl.user_label = pages_config[page.datum.type].fields.users.label;
            ctrl.page_label = pages_config[page.datum.type].label;
            ctrl.user_model = user_model;
            ctrl.page_fields = pages_config[page.datum.type].fields;
            
              //SEND PASSWORD
            ctrl.sendPassword = function(user_id, page_id){
                page_users.sendPassword(user_id, page_id).then(function(nb){
                    if(user_id){
                        user_model.list[user_id].datum.email_sent = 1;
                    }
                    if(page_id){
                        users.members.concat(users.administrators).concat(users.pending).concat(users.invited).forEach(function(id){
                            if(user_model.list[id] && user_model.list[id].datum){
                                user_model.list[id].datum.email_sent = 1;
                            }
                        });
                    }

                    $translate('ntf.admin_pwd_emails',{number:nb}).then(function( translation ){
                        notifier_service.add({type:'message',title: translation});
                    });
                });
            };
            
            

            //CONVERSATION
            ctrl.openConversation= function(user, conversation){
                social_service.openConversation(null, user ? [user] : null, conversation);
            };
            
            ctrl.search = "";
            ctrl.order = { 'type' : 'name' };
            var timeout = null;
            ctrl.searchParticipants = function(){
                if(timeout !== null){
                    clearTimeout(timeout);
                    timeout = null;
                }
                timeout = setTimeout(function(){
                    timeout = null;
                    var search = ctrl.search;
                    if(!ctrl.search.length && ctrl.order.type === 'name'){
                        ctrl.clearSearch();
                    }
                    else{
                        var deferred = $q.defer();
                        var step = ctrl.editable ? 5 : 3;
                        var onload = function(){
                            step--;
                            if( !step ){
                                this.loadPromise = undefined;
                                deferred.resolve();
                            }
                        }
                        page_users.search(page.datum.id, ctrl.search, null, null, null, null, ctrl.order).then(function(users){
                            if(ctrl.search === search){
                                ctrl.searched_all = users[page.datum.id];
                                ctrl.all_loaded = 36;
                            }
                            onload();
                        });
                        page_users.search(page.datum.id, ctrl.search, pages_constants.pageRoles.USER, pages_constants.pageStates.MEMBER, null, null, ctrl.order).then(function(users){
                            if(ctrl.search === search){
                                ctrl.searched_members = users[page.datum.id];
                                ctrl.members_loaded = 36;
                            }
                            onload();
                        });
                        page_users.search(page.datum.id, ctrl.search, pages_constants.pageRoles.ADMIN, pages_constants.pageStates.MEMBER, null, null, ctrl.order).then(function(users){
                            if(ctrl.search === search){
                                ctrl.searched_administrators = users[page.datum.id];
                                ctrl.administrators_loaded = 36;
                            }
                            onload();
                        });
                    }
                }, 250);
              
            };
            ctrl.clearSearch = function(){
                $timeout(function(){
                    ctrl.search = "";
                    ctrl.searched_all = null;
                    ctrl.searched_members = null;
                    ctrl.searched_administrators = null;
                    ctrl.all_loaded = 36;
                    ctrl.members_loaded = 36;
                    ctrl.administrators_loaded = 36;
                });
            };
            
            var email_regex = new RegExp('^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$');
            
            ctrl.isEmail = function(source){
                return email_regex.test(source);
            };
            
            ctrl.pending_loaded = 3;
            ctrl.invited_loaded = 3;
            ctrl.searchUsers = function(search, filter){
                  return community.users(search, filter.p, filter.n, null, null, null, null, null, { type : 'affinity' }).then(function(r){
                        return user_model.queue(r.list).then(function(){
                            return r.list.map(function(u){ return user_model.list[u].datum; }); 
                        });
                  });
            };
            ctrl.addUsers = function(ids, emails){
                if(!!ids){
                    var method = [pages_constants.pageTypes.EVENT, pages_constants.pageTypes.GROUP]
                            .indexOf(page.datum.type) !== -1  ?  page_users.invite : page_users.add;
                    ids = Array.isArray(ids) ? ids : [ids];
                    method(page.datum.id, ids)
                }
                if(!!emails){
                    emails = (Array.isArray(emails) ? emails : [emails]).filter(function(email){ return ctrl.isEmail(email); });
                    if(emails.length){
                        page_users.apply(page.datum.id, [], emails);
                    }
                }

            };

            ctrl.deleteUser = function(uid){
                user_profile.delete(uid).then(function(){
                    events_service.process('pageUsers' + page.datum.id);
                });
            };
        }
    ]);
