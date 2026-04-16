import Time "mo:core/Time";
import Array "mo:core/Array";
import List "mo:core/List";
import VarArray "mo:core/VarArray";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Bool "mo:core/Bool";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import OutCall "http-outcalls/outcall";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let nanosecondsPerDay = 24 * 60 * 60 * 1_000_000_000;

  public type Frequency = { #daily; #twiceDaily; #weekly; #asNeeded };

  public type MedicineReminder = {
    id : Text;
    name : Text;
    dosage : Text;
    frequency : Frequency;
    times : [Text];
    notes : Text;
    isActive : Bool;
    color : Text;
  };

  public type DoseStatus = { #taken; #snoozed; #missed };

  public type DoseLog = {
    reminderId : Text;
    timestamp : Int;
    status : DoseStatus;
    snoozeMinutes : ?Int;
  };

  public type DayStats = {
    date : Text;
    totalDoses : Nat;
    takenDoses : Nat;
    missedDoses : Nat;
    snoozedDoses : Nat;
  };

  public type ReminderDayStats = {
    reminderId : Text;
    reminderName : Text;
    totalDoses : Nat;
    takenDoses : Nat;
    missedDoses : Nat;
    snoozedDoses : Nat;
    adherenceRate : Float;
  };

  module DoseLog {
    public func compare(a : DoseLog, b : DoseLog) : Order.Order {
      Int.compare(a.timestamp, b.timestamp);
    };
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let reminders = Map.empty<Principal, Map.Map<Text, MedicineReminder>>();
  let logs = Map.empty<Principal, Map.Map<Text, DoseLog>>();

  func getUserReminders(caller : Principal) : Map.Map<Text, MedicineReminder> {
    switch (reminders.get(caller)) {
      case (null) { Map.empty<Text, MedicineReminder>() };
      case (?reminderMap) { reminderMap };
    };
  };

  func getUserLogs(caller : Principal) : Map.Map<Text, DoseLog> {
    switch (logs.get(caller)) {
      case (null) { Map.empty<Text, DoseLog>() };
      case (?logMap) { logMap };
    };
  };

  func updateUserReminders(caller : Principal, reminderMap : Map.Map<Text, MedicineReminder>) {
    reminders.add(caller, reminderMap);
  };

  func updateUserLogs(caller : Principal, logMap : Map.Map<Text, DoseLog>) {
    logs.add(caller, logMap);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func createReminder(reminder : MedicineReminder) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create reminders");
    };

    let userReminders = getUserReminders(caller);
    userReminders.add(reminder.id, reminder);
    updateUserReminders(caller, userReminders);
  };

  public shared ({ caller }) func updateReminder(reminder : MedicineReminder) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update reminders");
    };

    let userReminders = getUserReminders(caller);
    if (not userReminders.containsKey(reminder.id)) {
      Runtime.trap("Reminder not found");
    };
    userReminders.add(reminder.id, reminder);
    updateUserReminders(caller, userReminders);
  };

  public shared ({ caller }) func deleteReminder(reminderId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete reminders");
    };

    let userReminders = getUserReminders(caller);
    if (not userReminders.containsKey(reminderId)) {
      Runtime.trap("Reminder not found");
    };
    userReminders.remove(reminderId);
    updateUserReminders(caller, userReminders);

    let userLogs = getUserLogs(caller);
    let filteredLogs = userLogs.entries().filter(func((_, log)) { log.reminderId != reminderId });
    let newLogMap = Map.fromIter<Text, DoseLog>(filteredLogs);
    updateUserLogs(caller, newLogMap);
  };

  public query ({ caller }) func getReminder(reminderId : Text) : async MedicineReminder {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reminders");
    };

    switch (getUserReminders(caller).get(reminderId)) {
      case (null) { Runtime.trap("Reminder not found") };
      case (?reminder) { reminder };
    };
  };

  public query ({ caller }) func getAllReminders() : async [MedicineReminder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reminders");
    };

    getUserReminders(caller).values().toArray();
  };

  public shared ({ caller }) func logDose(doseLog : DoseLog) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can log doses");
    };

    // FIX: Explicitly convert timestamp from Int to Text before concatenating.
    let userLogs = getUserLogs(caller);
    userLogs.add(doseLog.reminderId # "_" # doseLog.timestamp.toText(), doseLog);
    updateUserLogs(caller, userLogs);
  };

  func getAlignedDayStart(timestampNs : Int) : Int {
    let dayNumber = timestampNs / nanosecondsPerDay;
    dayNumber * nanosecondsPerDay;
  };

  func calculateDayStats({ caller } : { caller : Principal }, dayStartNS : Int) : DayStats {
    let userLogs = getUserLogs(caller);

    let dayStart = getAlignedDayStart(dayStartNS);
    let dayEnd = dayStart + nanosecondsPerDay;

    var totalDoses = 0;
    var takenDoses = 0;
    var missedDoses = 0;
    var snoozedDoses = 0;

    userLogs.values().forEach(func(log) {
      if (log.timestamp >= dayStart and log.timestamp < dayEnd) {
        totalDoses += 1;
        switch (log.status) {
          case (#taken) { takenDoses += 1 };
          case (#missed) { missedDoses += 1 };
          case (#snoozed) { snoozedDoses += 1 };
        };
      };
    });

    {
      date = dayStart.toText();
      totalDoses;
      takenDoses;
      missedDoses;
      snoozedDoses;
    };
  };

  func calculateDayStatsRange({ caller } : { caller : Principal }, startTimeNS : Int, endTimeNS : Int) : DayStats {
    let userLogs = getUserLogs(caller);

    var totalDoses = 0;
    var takenDoses = 0;
    var missedDoses = 0;
    var snoozedDoses = 0;

    userLogs.values().forEach(func(log) {
      if (log.timestamp >= startTimeNS and log.timestamp <= endTimeNS) {
        totalDoses += 1;
        switch (log.status) {
          case (#taken) { takenDoses += 1 };
          case (#missed) { missedDoses += 1 };
          case (#snoozed) { snoozedDoses += 1 };
        };
      };
    });

    {
      date = startTimeNS.toText();
      totalDoses;
      takenDoses;
      missedDoses;
      snoozedDoses;
    };
  };

  public query ({ caller }) func getDayStats(dayStartNS : Int) : async DayStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view stats");
    };

    calculateDayStats({ caller }, dayStartNS);
  };

  public query ({ caller }) func getDayStatsRange(startTimeNS : Int, endTimeNS : Int) : async DayStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view stats");
    };

    calculateDayStatsRange({ caller }, startTimeNS, endTimeNS);
  };

  func calculateReminderDayStats({ caller } : { caller : Principal }, reminderId : Text, dayStartNS : Int) : ReminderDayStats {
    let userLogs = getUserLogs(caller);

    let dayStart = getAlignedDayStart(dayStartNS);
    let dayEnd = dayStart + nanosecondsPerDay;

    var totalDoses = 0;
    var takenDoses = 0;
    var missedDoses = 0;
    var snoozedDoses = 0;

    userLogs.values().forEach(func(log) {
      if (log.reminderId == reminderId and log.timestamp >= dayStart and log.timestamp < dayEnd) {
        totalDoses += 1;
        switch (log.status) {
          case (#taken) { takenDoses += 1 };
          case (#missed) { missedDoses += 1 };
          case (#snoozed) { snoozedDoses += 1 };
        };
      };
    });

    let reminderName = switch (getUserReminders(caller).get(reminderId)) {
      case (null) { "" };
      case (?reminder) { reminder.name };
    };

    {
      reminderId;
      reminderName;
      totalDoses;
      takenDoses;
      missedDoses;
      snoozedDoses;
      adherenceRate = if (totalDoses > 0) {
        (takenDoses + snoozedDoses).toFloat() / totalDoses.toFloat();
      } else { 0.0 };
    };
  };

  func calculateReminderDayStatsRange({ caller } : { caller : Principal }, reminderId : Text, startTimeNS : Int, endTimeNS : Int) : ReminderDayStats {
    let userLogs = getUserLogs(caller);

    var totalDoses = 0;
    var takenDoses = 0;
    var missedDoses = 0;
    var snoozedDoses = 0;

    userLogs.values().forEach(func(log) {
      if (log.reminderId == reminderId and log.timestamp >= startTimeNS and log.timestamp <= endTimeNS) {
        totalDoses += 1;
        switch (log.status) {
          case (#taken) { takenDoses += 1 };
          case (#missed) { missedDoses += 1 };
          case (#snoozed) { snoozedDoses += 1 };
        };
      };
    });

    let reminderName = switch (getUserReminders(caller).get(reminderId)) {
      case (null) { "" };
      case (?reminder) { reminder.name };
    };

    {
      reminderId;
      reminderName;
      totalDoses;
      takenDoses;
      missedDoses;
      snoozedDoses;
      adherenceRate = if (totalDoses > 0) {
        (takenDoses + snoozedDoses).toFloat() / totalDoses.toFloat();
      } else { 0.0 };
    };
  };

  public query ({ caller }) func getReminderDayStats(reminderId : Text, dayStartNS : Int) : async ReminderDayStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view stats");
    };

    calculateReminderDayStats({ caller }, reminderId, dayStartNS);
  };

  public query ({ caller }) func getReminderDayStatsRange(reminderId : Text, startTimeNS : Int, endTimeNS : Int) : async ReminderDayStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view stats");
    };

    calculateReminderDayStatsRange({ caller }, reminderId, startTimeNS, endTimeNS);
  };

  public query ({ caller }) func getAllDayLogs(dayStartNS : Int) : async [DoseLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view logs");
    };

    let userLogs = getUserLogs(caller);

    let dayStart = getAlignedDayStart(dayStartNS);
    let dayEnd = dayStart + nanosecondsPerDay;

    let dayLogs = userLogs.values().toArray().filter(func(log) { log.timestamp >= dayStart and log.timestamp < dayEnd });

    dayLogs.sort();
  };

  public query ({ caller }) func getAllDayLogsRange(startTimeNS : Int, endTimeNS : Int) : async [DoseLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view logs");
    };

    let userLogs = getUserLogs(caller);

    let dayLogs = userLogs.values().toArray().filter(func(log) { log.timestamp >= startTimeNS and log.timestamp <= endTimeNS });

    dayLogs.sort();
  };

  public query ({ caller }) func getReminderDayLogs(reminderId : Text, dayStartNS : Int) : async [DoseLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view logs");
    };

    let userLogs = getUserLogs(caller);

    let dayStart = getAlignedDayStart(dayStartNS);
    let dayEnd = dayStart + nanosecondsPerDay;

    let dayLogs = userLogs.values().toArray().filter(func(log) { log.reminderId == reminderId and log.timestamp >= dayStart and log.timestamp < dayEnd });

    dayLogs.sort();
  };

  public query ({ caller }) func getReminderDayLogsRange(reminderId : Text, startTimeNS : Int, endTimeNS : Int) : async [DoseLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view logs");
    };

    let userLogs = getUserLogs(caller);

    let dayLogs = userLogs.values().toArray().filter(func(log) { log.reminderId == reminderId and log.timestamp >= startTimeNS and log.timestamp <= endTimeNS });

    dayLogs.sort();
  };

  func getTodayStart() : Int {
    let nowNS = Time.now();
    let dayNumber = nowNS / nanosecondsPerDay;
    dayNumber * nanosecondsPerDay;
  };

  public shared query ({ caller }) func getCurrentStreak() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view stats");
    };

    let todayStart = getTodayStart();

    var streak = 0;
    var dayOffset : Int = 0;

    loop {
      let dayNS = todayStart - (dayOffset * nanosecondsPerDay);
      let stats = calculateDayStats({ caller }, dayNS);

      if (stats.totalDoses > 0 and (stats.takenDoses + stats.snoozedDoses) == stats.totalDoses) {
        streak += 1;
      } else {
        if (stats.totalDoses > 0) {
          return streak;
        };
      };

      dayOffset += 1;
    };
  };

  public shared ({ caller }) func getMedicineInfo(brandName : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can lookup medicine information");
    };

    let searchName = brandName.toLower();
    let url = "https://api.fda.gov/drug/label.json?search=brand_name:" # searchName # "&limit=1";

    await OutCall.httpGetRequest(url, [], transform);
  };

  public query ({ caller }) func getAllReminderDayStats(dayStartNS : Int) : async [ReminderDayStats] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view stats");
    };

    let userReminders = getUserReminders(caller);

    let statsList = List.empty<ReminderDayStats>();
    userReminders.values().forEach(func(reminder) {
      let stats = calculateReminderDayStats({ caller }, reminder.id, dayStartNS);
      statsList.add(stats);
    });

    statsList.toArray();
  };

  public query ({ caller }) func getAllReminderDayStatsRange(startTimeNS : Int, endTimeNS : Int) : async [ReminderDayStats] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view stats");
    };

    let userReminders = getUserReminders(caller);

    let statsList = List.empty<ReminderDayStats>();
    userReminders.values().forEach(func(reminder) {
      let stats = calculateReminderDayStatsRange({ caller }, reminder.id, startTimeNS, endTimeNS);
      statsList.add(stats);
    });

    statsList.toArray();
  };

  func getNthDayStart(n : Int) : Int {
    let todayStart = getTodayStart();
    todayStart - (n * nanosecondsPerDay);
  };

  public query ({ caller }) func getPastNDayStats(nDays : Nat) : async [(Int, DayStats)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view stats");
    };

    let statsArray = VarArray.repeat<(Int, DayStats)>((0, {
      date = "";
      totalDoses = 0;
      takenDoses = 0;
      missedDoses = 0;
      snoozedDoses = 0;
    }), nDays);

    for (i in Nat.range(0, nDays)) {
      let dayNS = getNthDayStart(i.toInt());
      let stats = calculateDayStats({ caller }, dayNS);
      statsArray[i] := (dayNS, stats);
    };

    statsArray.reverse().values().toArray();
  };

  public query ({ caller }) func getAllReminderLogs(reminderId : Text) : async [DoseLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view logs");
    };

    let userLogs = getUserLogs(caller);

    let reminderLogs = userLogs.values().toArray().filter(func(log) { log.reminderId == reminderId });

    reminderLogs.sort();
  };

  public query ({ caller }) func getAllLogs() : async [DoseLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view logs");
    };

    getUserLogs(caller).values().toArray().sort();
  };
};
