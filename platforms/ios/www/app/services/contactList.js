/* app.services.contactList
 *
 * This AngularJS service implements the contact list for the StatusAPITest
 * app.
 */

angular.module('app.services.contactList',
               ['app.lib.storage',
                'app.lib.config']);

angular.module('app.services.contactList').factory('ContactList',
    ['$http', '$q', 'config', 'storage',
     function($http, $q, config, storage) {

    var contacts = null; // Our list of contacts.  Each entry is an object with
                         // the following fields:
                         //
                         //     'global_id'
                         //
                         //         The global ID of this contact.
                         //
                         //     'pending'
                         //
                         //         Are we still waiting for permission to be
                         //         granted to follow this contact's location?
                         //
                         // Note that this is set to 'null' until we load the
                         // contacts in for the first time.

    // ======================================================================
    // =                                                                   ==
    // =                  I N T E R N A L   F U N C T I O N S              ==
    // =                                                                   ==
    // ======================================================================
    //
    // load()
    //
    //     Load the list of contacts into memory.

    var load = function() {

        contacts = [];
        var saved_contacts = storage.get("contact_list");
        if (saved_contacts != null) {
            for (var i=0; i < saved_contacts.length; i++) {
                var contact = saved_contacts[i];
                contacts.push({global_id : contact.global_id,
                               pending   : contact.pending});
            }
        }
    }

    // ======================================================================
    //
    // save()
    //
    //     Save the list of contacts back into our storage module.

    var save = function() {

        var contacts_to_save = [];
        for (var i=0; i < contacts.length; i++) {
            var contact = contacts[i];
            contacts_to_save.push({global_id : contact.global_id,
                                   pending   : contact.pending});
        }
        storage.set("contact_list", contacts_to_save)
    }

    // ======================================================================
    //
    // sort()
    //
    //     Sort our contact list.
    //
    //     We sort the list of contacts so that pending contacts are at the
    //     bottom.  Then within each group, the contacts are sorted by global
    //     ID.

    var sort = function() {

        contacts.sort(function(c1, c2) {
            if (c1.pending != c2.pending) {
                if (c1.pending) {
                    return -1;
                } else {
                    return 1;
                }
            }
            if (c1.global_id < c2.global_id) {
                return -1;
            } else if (c1.global_id > c2.global_id) {
                return 1;
            } else {
                return 0;
            }
        });
    }

    // ======================================================================
    // =                                                                   ==
    // =                    P U B L I C   F U N C T I O N S                ==
    // =                                                                   ==
    // ======================================================================
    //
    // get()
    //
    //     Return the current list of contacts.

    var get = function() {

        if (contacts == null) {
            load();
        }

        return contacts
    }

    // ======================================================================
    //
    // add(global_id, pending)
    //
    //     Add the given contact details to our list.

    var add = function(global_id, pending) {

        if (contacts == null) {
            load();
        }

        var contact = {global_id: global_id,
                       pending:   pending};

        contacts.push(contact);
        sort();
        save();
    }

    // ======================================================================
    //
    // remove(global_id)
    //
    //     Remove the given contact from our list.

    var remove = function(global_id) {

        if (contacts == null) {
            load();
        }

        for (var i=0; i < contacts.length; i++) {
            var contact = contacts[i];
            if (contact.global_id == global_id) {
                contacts.splice(i, 1);
                break
            }
        }
        save();
    }

    // ======================================================================
    //
    // update(global_id, pending)
    //
    //     Update the details of the given contact.
    //
    //     We set the "pending" value for the given contact.

    var update = function(global_id, pending) {

        if (contacts == null) {
            load();
        }

        for (var i=0; i < contacts.length; i++) {
            var contact = contacts[i];
            if (contact.global_id == global_id) {
                contact.pending = pending;
                break
            }
        }
        save();
    }

    // ======================================================================
    //
    // find(global_id)
    //
    //     Returns the index into the contact list for the given global ID.
    //
    //     If the given global ID is not in the contact list, returns -1.

    var find = function(global_id) {

        if (contacts == null) {
            load();
        }

        for (var i=0; i < contacts.length; i++) {
            var contact = contacts[i];
            if (contact.global_id == global_id) {
                return i;
            }
        }
        return -1; // Not found.
    }

    // ======================================================================
    //
    // Our public interface:

    return {
        get    : get,
        add    : add,
        remove : remove,
        update : update,
        find   : find
    }
}]);

