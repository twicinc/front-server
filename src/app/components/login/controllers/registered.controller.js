angular.module('login').controller('registered_controller',
    ['account', 'preregistration', '$translate', 'notifier_service',
        function( account, preregistration, $translate, notifier_service ){
            var ctrl = this;
            ctrl.resend = function(){
                if(!ctrl.sending){
                    ctrl.sending = true;
                      account.presign_in( null, null, preregistration.email, preregistration.organization_id).then(function(){
                        ctrl.sending = false;
                        $translate('ntf.mail_signin_sent').then(function( translation ){
                            notifier_service.add({type:'message',message: translation });
                        });
                    });
                }
            };

        }
    ]);
