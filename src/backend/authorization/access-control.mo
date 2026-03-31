import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

module {
  public type UserRole = {
    #admin;
    #user;
    #guest;
  };

  public type AccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  public func initState() : AccessControlState {
    {
      var adminAssigned = false;
      userRoles = Map.empty<Principal, UserRole>();
    };
  };

  // Register a caller. Anonymous callers are allowed so that apps using
  // custom username/password login (non-Internet-Identity) can still
  // authenticate via the Caffeine admin token.
  public func initialize(state : AccessControlState, caller : Principal, adminToken : Text, userProvidedToken : Text) {
    switch (state.userRoles.get(caller)) {
      case (?_) {
        // Already registered – nothing to do
      };
      case (null) {
        if (not state.adminAssigned and userProvidedToken == adminToken) {
          state.userRoles.add(caller, #admin);
          state.adminAssigned := true;
        } else {
          state.userRoles.add(caller, #user);
        };
      };
    };
  };

  public func getUserRole(state : AccessControlState, caller : Principal) : UserRole {
    switch (state.userRoles.get(caller)) {
      case (?role) { role };
      case (null) {
        // Unregistered callers (including anonymous) are guests
        #guest;
      };
    };
  };

  public func assignRole(state : AccessControlState, caller : Principal, user : Principal, role : UserRole) {
    if (not (isAdmin(state, caller))) {
      Runtime.trap("Unauthorized: Only admins can assign user roles");
    };
    state.userRoles.add(user, role);
  };

  public func hasPermission(state : AccessControlState, caller : Principal, requiredRole : UserRole) : Bool {
    let userRole = getUserRole(state, caller);
    if (userRole == #admin or requiredRole == #guest) { true } else {
      userRole == requiredRole;
    };
  };

  public func isAdmin(state : AccessControlState, caller : Principal) : Bool {
    getUserRole(state, caller) == #admin;
  };
};
