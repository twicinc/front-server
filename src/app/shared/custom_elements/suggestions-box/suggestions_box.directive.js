angular.module('customElements')
    .directive('suggestionsBox',['user_model', 'connections', '$translate', 'notifier_service', 'community_service',
               'session', 'tags_constants', '$interval', 'filters_functions', 'page_model',
            function(user_model, connections, $translate, notifier_service, community_service,
                session, tags_constants, $interval, filters_functions, page_model){

            return {
                restrict:'E',
                scope:{

                },
                link: function( scope, element ){
                      scope.ew = 105;
                      scope.list = [];
                      scope.loaded = 0;
                      scope.added = [];
                      scope.random = [parseInt(Math.random() * 12), parseInt(Math.random() * 12), parseInt(Math.random() * 12), parseInt(Math.random() * 12), parseInt(Math.random() * 12), parseInt(Math.random() * 12), parseInt(Math.random() * 12)]
                      scope.users = user_model.list;
                      scope.page = 0;
                      scope.padding = 0;
                      scope.incommon = {};
                      scope.incommon_index = {};
                      var me;
                      function checkWidth(){
                          scope.width = element[0].clientWidth;
                          scope.nb_element = parseInt(scope.width / scope.ew);
                      }

                      function loadPage(page){
                          if(scope.loaded < scope.nb_element * (page + 2)){
                              community_service.users(null, page + 1, scope.nb_element * 2, [session.id], null, null, null, null, { type : 'affinity' }, 0, null, true).then(function(users){
                                  scope.list_width = users.count;
                                  users.list.forEach(function(uid, index){
                                      scope.list.splice(page  * scope.nb_element * 2 + index, 1, uid);
                                  });
                                  user_model.queue(users.list).then(function(){
                                      users.list.forEach(function(id){
                                          if(!scope.incommon[id]){
                                              scope.incommon[id] = [];
                                              var user = user_model.list[id].datum;
                                              if(me.programs && user.programs && me.programs[0] === user.programs[0] && me.graduation_year && me.graduation_year === user.graduation_year){
                                                scope.incommon[id].push({ icon : 'i-projects', name : user.programs[0] });
                                              }
                                              if(user.nbr_user_common){
                                                  scope.incommon[id].push({ icon : 'i-common', name : user.nbr_user_common + filters_functions.plural(" common connection%s%", user.nbr_user_common) });
                                              }
                                              if(user.address && me.address && user.address.city && me.address.city && user.address.city.name === me.address.city.name){
                                                  scope.incommon[id].push({ icon : 'i-map', name : user.address.city.name });
                                              }
                                              if(user.origin && me.origin && user.origin.id === me.origin.id){
                                                  scope.incommon[id].push({ icon : 'i-origin', name : user.origin.short_name });
                                              }
                                              user.tags.forEach(function(utag){
                                                  var tag = me.tags.find(function(mtag){
                                                      return utag.id === mtag.id;
                                                  });
                                                  if(tag){
                                                    scope.incommon[id].push({ icon : tags_constants.icons[tag.category], name : tag.name });
                                                  }
                                              });
                                              page_model.queue([user.organization_id]).then(function(){
                                                  var organization = page_model.list[user.organization_id].datum;
                                                  scope.incommon[id].push({ img : organization.logo, name : organization.title });
                                                  scope.incommon[id] = scope.incommon[id].sort(function() {
                                                    return .5 - Math.random();
                                                  });
                                                  scope.incommon_index[id] = 0;

                                              });

                                          }
                                      });
                                  });
                                  scope.max_page = parseInt((scope.list_width - 1) / scope.nb_element);
                                  scope.loaded = scope.nb_element * (page + 1);
                              });
                          }
                          else{
                              scope.max_page = parseInt((scope.list_width - 1) / scope.nb_element);
                          }

                      }

                      scope.nextPage = function(){
                          checkWidth();
                          scope.page = Math.min(scope.max_page, scope.page + 1);
                          scope.padding = scope.page > 0 ? 10 : 0;
                          loadPage(scope.page);
                      };

                      scope.previousPage = function(){
                          checkWidth();
                          scope.page = Math.max(0, scope.page - 1);
                          scope.padding = scope.page > 0 ? 10 : 0;
                          loadPage(scope.page);
                      };

                      scope.add = function(id){
                          scope.added.push(id);
                          checkWidth();
                          connections.request(id).then(function(){
                              loadPage(scope.page);
                              $translate('ntf.co_req_sent').then(function( translation ){
                                  notifier_service.add({type:"message",message: translation});
                              });
                          }, function(){
                              scope.added.splice(scope.added.indexOf(id), 1);
                          });
                      };
                      var slider = new Hammer(element[0]);
                      slider.get('swipe').set({ direction: Hammer.DIRECTION_HORIZONTAL });
                      slider.on('swipe', function(ev) {
                          ev.deltaX  > 0 ? scope.previousPage() : scope.nextPage();
                          scope.$apply();
                      });

                      user_model.queue([session.id]).then(function(){
                          me = user_model.list[session.id].datum;
                          checkWidth();
                          loadPage(0);
                      });

                      var index = -1;
                      function launchCarousel(){
                        if(!scope.interval){
                            scope.interval = $interval(function(){
                                index = (index + 1) % scope.nb_element;
                                if(index + scope.page * scope.nb_element > scope.list.length){
                                    index = 0;
                                }
                                var id = scope.list[index + scope.page * scope.nb_element];
                                if(scope.incommon[id] && scope.incommon_index[id] >= 0){
                                  scope.incommon_index[id] = (scope.incommon_index[id] + 1) % scope.incommon[id].length;
                                }
                            }, 1000);
                        }
                      }

                      function pauseCarousel(){
                          if(scope.interval){
                             $interval.cancel(scope.interval);
                             scope.interval = null;
                          }
                      }
                      function onVisibilityChange(){
                          if(document.hidden){
                             pauseCarousel();
                          }
                          else{
                              launchCarousel();
                          }
                      }

                      launchCarousel();
                      document.addEventListener("visibilitychange", onVisibilityChange, false);
                      scope.$on('destroy',function(){
                        document.removeEventListener("visibilitychange", onVisibilityChange, false);
                      });

                },
                transclude: true,
                templateUrl: 'app/shared/custom_elements/suggestions-box/suggestions_box.html'
            };
        }
    ]);
