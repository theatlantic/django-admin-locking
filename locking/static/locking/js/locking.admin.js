/**
 * Extends locking.js code for use with in Django's admin
 */
;(function (locking, undefined) {
    'use strict';

    var $ = locking.jQuery;

    /**
     * When instantiated ChangeListView periodically checks the locking API
     * and displays which articles are locked.
     */
    var ChangeListView = function (opts) {
        this.currentUser = opts.currentUser;
        this.api = new locking.API(opts.apiURL, opts.messages);
        this.lockedByMeText = opts.messages.lockedByMeText;
        this.lockedByUserText = opts.messages.lockedByUserText;
        this.cookieName = opts.appLabel + opts.modelName + 'unlock';
        this.updateStatus();
        setInterval(this.updateStatus.bind(this), opts.ping * 1000);
    };
    ChangeListView.prototype.updateStatus = function () {
        var self = this;
        this.api.ajax({success: function (data) {
            var user, name, lockedClass, lockedMessage;
            $('.locking-status.locked').removeClass('locked').removeAttr('title');
            for (var i = 0; i < data.length; i++) {
                user = data[i]['locked_by'];
                // Occasionally the user will be logged out but will still have a browser tab
                // open with a page calling the locking api.
                if (!user) {
                  return;
                }

                if (user['username'] === self.currentUser) {
                    lockedMessage = self.lockedByMeText;
                    lockedClass = "editing";
                } else {
                    name = user['first_name'] + ' ' + user['last_name'];
                    if (name === ' ') {
                        name = user['username'];
                    }
                    lockedMessage = self.lockedByUserText + ' ' + name;
                    if (user['email']){
                        lockedMessage += ' (' + user['email'] + ')';
                    }
                    lockedClass = "locked";
                }
                $('#locking-' + data[i]['object_id'])
                    .removeClass('locked editing')
                    .addClass(lockedClass)
                    .attr('title', lockedMessage)
                    .click(function () {
                        locking.cookies.set(self.cookieName, '1', 60 * 1000);
                    });
            }
        }});
    };
    locking.ChangeListView = ChangeListView;


    /**
     * Extends LockingForm with logic specific to Django admin forms
     */
    var LockingAdminForm = function($form, opts) {
        var self = this;
        this.init($form, opts);

        var cookieName = opts.appLabel + opts.modelName + 'unlock';
        if (locking.cookies.get(cookieName) === '1') {
            this.hasHadLock = true;
            this.takeLock();
            locking.cookies.del(cookieName);
        } else {
            // Attempt to get a lock
            this.getLock();
        }

        // Every ping number of seconds: maintain the lock if we hold it,
        // otherwise only check (read-only) whether the post has become free.
        // A tab without the lock must never send the lock-claiming POST, or
        // it would silently take the lock when the holder's lock lapses
        // (e.g. laptop sleep), triggering a bogus "lock was taken" alert.
        setInterval(function() {
            if (self.hasLock) {
                self.getLock();
            } else {
                self.checkAvailable();
            }
        }, self.ping * 1000);

        // Unlock the form when leaving the page
        $(window).on('beforeunload submit', function() {
            if (self.hasLock && self.removeLockOnUnload) {
                // We have to assure that our unlock request gets through
                // before the user leaves the page, so it shouldn't run
                // asynchronously.
                //
                // However, newer browser versions have deprecated
                // synchronous AJAX calls, and instead provide a "Beacon"
                // API for sending requests before a page unloads. If
                // window.navigator.sendBeacon is available we use it
                // instead of a synchronous AJAX call
                if (typeof navigator.sendBeacon === 'function') {
                    navigator.sendBeacon(self.api.apiURL + '?method=delete');
                } else {
                    self.api.unlock({'async': false});
                }
                self.hasLock = false;
            }
        });


        // Don't remove the lock when choosing 'save and continue editing'
        $('input[type=submit][name="_continue"]').click(function() {
            self.removeLockOnUnload = false;
        });
        self.takeLockText = opts.messages.takeLockText;
        self.formIsLockedByText = opts.messages.formIsLockedByText;
        self.postAvailableText = opts.messages.postAvailableText;
        self.editThisPostText = opts.messages.editThisPostText;
    };
    $.extend(LockingAdminForm.prototype, locking.LockingForm.prototype);
    $.extend(LockingAdminForm.prototype, {
        getWarningHtml: function() {
            var self = this;
            return '<ul class="messagelist grp-messagelist">' +
                        '<li class="error grp-error" id="locking-warning">' +
                            self.formIsLockedByText + ' <span class="locking-locked-by"></span>' +
                            '<a id="locking-take-lock" class="button grp-button rounded-button" onclick="window.locking.lockingFormInstance.takeLock()">' +
                                self.takeLockText +
                            '</a>' +
                        '</li>' +
                     '</ul>'
        },
        lockedBy: {
            setUp: function (data) {
                this.name = data['username'];
                if (data['first_name'] && data['last_name']) {
                    this.name = data['first_name'] + ' ' + data['last_name'];
                }
                this.email = data.email;
            }
        },
        /**
         * Update the "Form is locked by" banner with the current lock holder.
         * Safe to call on every 409 and every availability check.
         */
        updateLockedBy: function(lockedBy) {
            if (!lockedBy) {
                return;
            }
            this.lockedBy.setUp(lockedBy);
            $("#locking-warning .locking-locked-by").html(
                this.lockedBy.name +
                ' (<a href="mailto:' + this.lockedBy.email + '">' +
                    this.lockedBy.email +
                '</a>)'
            );
        },
        getAvailableNoticeHtml: function() {
            return '<ul class="messagelist grp-messagelist" id="locking-available">' +
                        '<li class="success grp-success">' +
                            this.postAvailableText + ' ' +
                            '<a id="locking-claim-lock" class="button grp-button rounded-button" onclick="window.locking.lockingFormInstance.claimLock()">' +
                                this.editThisPostText +
                            '</a>' +
                        '</li>' +
                     '</ul>';
        },
        showAvailableNotice: function() {
            if ($('#locking-available').length === 0) {
                this.$form.before(this.getAvailableNoticeHtml());
            }
        },
        hideAvailableNotice: function() {
            $('#locking-available').remove();
        },
        /**
         * Read-only check used by tabs that don't hold the lock. Never
         * claims the lock; it only shows or hides the "available" prompt.
         */
        checkAvailable: function() {
            var self = this;
            this.api.ajax({
                type: 'GET',
                success: function(locks) {
                    if (locks.length === 0) {
                        self.showAvailableNotice();
                    } else {
                        self.hideAvailableNotice();
                        self.updateLockedBy(locks[0]['locked_by']);
                    }
                }
            });
        },
        /**
         * Called by the "Edit this post" button. Sends the normal lock
         * request (not "Take over"), so it fails with a 409 if someone
         * else got there first.
         */
        claimLock: function() {
            this.hideAvailableNotice();
            this.getLock();
        },
        disableForm: function(data) {
            if (!this.formDisabled) {
                // Disable Delete link
                $('.deletelink').css({'cursor': 'not-allowed', 'opacity': 0.5}).click(false);

                // Add warning notice to form
                this.$form.before(this.getWarningHtml());
            }
            // Lookup who has the lock (on every 409, not just the first)
            if (data && data[0]) {
                this.updateLockedBy(data[0]['locked_by']);
            }
            locking.LockingForm.prototype.disableForm.call(this);
        },
        enableForm: function() {
            this.hideAvailableNotice();
            if (this.formDisabled) {
                $('#locking-warning').parent().remove();
            }
            locking.LockingForm.prototype.enableForm.call(this);
        }
    });
    locking.LockingAdminForm = LockingAdminForm;

})(window.locking);
