angular.module('profile').controller('tags_controller',
    ['session', 'user', 'user_model', 'page_model',  'languages',
        'filters_functions', '$state', 'profile', 'user_profile',
        'state_service', '$q', 'community_service', '$timeout',
        'global_search', 'tags_constants', 'user_tags',
        function(session, user,  user_model, page_model, languages,
        filters_functions, $state, profile, user_profile,
        state_service, $q, community_service, $timeout,
        global_search, tags_constants, user_tags){

        var ctrl = this;
        ctrl.user = user;
        ctrl.constants = tags_constants;
        ctrl.me = session.id;
        ctrl.user_model = user_model;
        ctrl.page_model = page_model;
        ctrl.editable = session.roles[1] || user.datum.id === session.id;
        ctrl.languages = languages;
        ctrl.profile = session.roles[1] ? user_profile : profile;
        state_service.parent_state =  'lms.community';
        ctrl.state = $state;
        ctrl.tmp_description = null;
        ctrl.profile.getDescription(ctrl.user.datum.id).then(function(description){
          ctrl.description = description;
        });
        document.title = 'TWIC - ' + filters_functions.username(user.datum);
        ctrl.breadcrumb =  [
            { text : 'Discover', href : "lms.community({ category : 'users' })" },
            { text : filters_functions.username(user.datum) }
        ] ;


        //TAGS
        user_tags.getList(user.datum.id).then(function(tags){
            ctrl.tags = tags;
        });

        ctrl.tmp_tags = {};
        ctrl.editTags = {  };
        ctrl.setEditableTags = function(category){
            angular.forEach(tags_constants.categories, function( category, key ){
                ctrl.editTags[category] = false;
            });
            ctrl.editTags[category] = ctrl.editable;
        };

        ctrl.removeTag = function(name, category){
            user_tags.remove(user.datum.id, name, category);
        };

        ctrl.input_tags = {};
        ctrl.addTag = function( $event, name, category){
            if( $event && $event.keyCode === 13 && !ctrl.tags_list.length){
                $event.stopPropagation();
                $event.preventDefault();
                tag = { name: ctrl.input_tags[category].search, category : category};

            }
            else if(!$event){
                  tag = { name : name, category : category  };
            }
            if( tag.name.length && !ctrl.hasTag(tag.name, tag.category)){
                  $timeout(function(){
                      ctrl.input_tags[category].search = '';
                      user_tags.add(user.datum.id, tag.name, tag.category);
                  });
            }
        };

        ctrl.searchTag = function(tag){
            if(ctrl.editable) return;
            global_search.search =  tag;
            $state.go("lms.community", { category : 'users'});
        };

        ctrl.searchTags = function(search, category){
            return community_service.tags(
              search,
              category,
              1,
              5,
              ctrl.tags[category]
            );
        };

        ctrl.search = {};
        ctrl.add = {};
        angular.forEach(tags_constants.categories, function( category, key ){
            ctrl.search[key] = function(search){
                return ctrl.searchTags(search, category);
            };
            ctrl.add[key] = function($event, tag){
                if(!$event || $event.keyCode === 13){
                    ctrl.addTag($event, tag ? (tag.name || tag.libelle) : null, category);
                }
            };
        });

        ctrl.search.LANGUAGE = languages.getList;

        ctrl.hasTag = function(name, category){
            return ctrl.tags && ctrl.tags[category]
                .some(function(t){ return areEquals(t, name); });
        };

       function areEquals(tag1, tag2){
          return tag1.toLowerCase().replace(/\s/g, "") === tag2.toLowerCase().replace(/\s/g, "");
       }


    }
]);