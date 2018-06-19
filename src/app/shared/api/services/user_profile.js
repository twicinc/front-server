
angular.module('API')
    .factory('user_profile',
        ['user_model','user_resumes_model', 'resume_model','api_service','upload_service','$q',
            function( user_model, user_resumes_model, resume_model, api_service, upload_service, $q){

                var service = {

                    delete : function(uid){
                        return api_service.send('user.delete',{id: uid});
                    },
                    update: function( datas, uid ){
                        // HACK BECAUSE OF ORIGIN PARAM ....
                        var params = Object.assign({},datas);
                        if( datas.origin && datas.origin.id ){
                            params.origin = datas.origin.id;
                        }

                        return api_service.send('user.update', params).then(function(){
                            Object.keys(datas).forEach(function(k){
                                user_model.list[uid].datum[k] = datas[k];
                            }.bind(this));

                            user_model._updateModelCache(uid);
                        });

                    },

                    updateAvatar: function( blob, uid ){
                        var deferred = $q.defer(),
                            u = upload_service.upload('avatar', blob, 'profile_'+uid+'.png' );

                        u.promise.then(function(d){
                            if( d.avatar ){
                                return api_service.send('user.update',{avatar:d.avatar, id : uid}).then(function(){
                                    user_model.list[uid].datum.avatar = d.avatar;
                                    user_model._updateModelCache(uid);
                                    deferred.resolve();
                                });
                            }else{
                                deferred.reject();
                            }
                        }, function(){
                            deferred.reject();
                        }, function( evt ){
                            deferred.notify( evt);
                        });

                        return deferred.promise;
                    },
                    updateCover: function( blob, uid ){
                        var deferred = $q.defer();

                        upload_service.uploadImage('background', blob,'cover_'+uid+'.png' ).then(function( upl ){
                            upl.promise.then(function(d){
                                if( d.background ){
                                    return api_service.send('user.update',{background:d.background, id : uid}).then(function(){
                                        user_model.list[uid].datum.background = d.background;
                                        user_model._updateModelCache(uid);
                                        deferred.resolve();
                                    });
                                }else{
                                    deferred.reject();
                                }
                            }, function(){
                                deferred.reject();
                            }, function( evt ){
                                deferred.notify( evt);
                            });
                        });

                        return deferred.promise;
                    } ,
                    updateNickname: function(nickname, uid ){
                        return api_service.send('user.update',{id : uid, nickname: nickname}).then(function(){
                            user_model.list[uid].datum.nickname = nickname;
                            user_model._updateModelCache(uid);
                        });
                    }   ,
                    updateAddress: function(address, uid ){
                        return api_service.send('user.update',{id : uid, address: address || "null"}).then(function(){
                            user_model.list[uid].datum.address = address;
                            user_model._updateModelCache(uid);
                        });
                    },
                    updateBirthdate: function(birthdate, uid){
                        return api_service.send('user.update',{id : uid, birth_date: birthdate || "null"}).then(function(){
                            user_model.list[uid].datum.birth_date = birthdate;
                            user_model._updateModelCache(uid);
                        });
                    },
                    updateOrigin: function(origin, uid){
                        return api_service.send('user.update',{id : uid, origin: origin ? origin.id : "null"}).then(function(){
                            user_model.list[uid].datum.origin = origin;
                            user_model._updateModelCache(uid);
                        });
                    },
                    addTag: function(user_id, tag, category ){
                        var tag = { name : tag, category : category };
                        user_model.list[user_id].datum.tags.push(tag);
                        return api_service.send('user.addTag',{id : user_id, tag:tag.name, category : tag.category}).then(function(id){
                            tag.id = id;
                            user_model._updateModelCache(user_id);
                        }, function(){
                            user_model.list[user_id].datum.tags.splice(user_model.list[user_id].datum.tags.indexOf(tag));
                        });
                    },
                    removeTag: function(user_id, tag ){
                        user_model.list[user_id].datum.tags.splice(user_model.list[user_id].datum.tags.indexOf(tag),1);
                        return api_service.send('user.removeTag',{id : user_id, tag_id:tag.id}).then(function(){
                            user_model._updateModelCache(user_id);
                        }, function(){
                            user_model.list[user_id].datum.tags.push(tag);
                        });
                    },
                    getDescription : function(id){
                      return api_service.send('user.getDescription', { id : id });
                    }

                };
                return service;
            }
        ]);
