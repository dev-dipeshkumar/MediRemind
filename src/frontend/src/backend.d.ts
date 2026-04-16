import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface DoseLog {
    status: DoseStatus;
    snoozeMinutes?: bigint;
    reminderId: string;
    timestamp: bigint;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface DayStats {
    missedDoses: bigint;
    date: string;
    takenDoses: bigint;
    snoozedDoses: bigint;
    totalDoses: bigint;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface MedicineReminder {
    id: string;
    times: Array<string>;
    dosage: string;
    name: string;
    color: string;
    isActive: boolean;
    notes: string;
    frequency: Frequency;
}
export interface ReminderDayStats {
    missedDoses: bigint;
    reminderId: string;
    reminderName: string;
    adherenceRate: number;
    takenDoses: bigint;
    snoozedDoses: bigint;
    totalDoses: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export enum DoseStatus {
    taken = "taken",
    missed = "missed",
    snoozed = "snoozed"
}
export enum Frequency {
    twiceDaily = "twiceDaily",
    daily = "daily",
    asNeeded = "asNeeded",
    weekly = "weekly"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createReminder(reminder: MedicineReminder): Promise<void>;
    deleteReminder(reminderId: string): Promise<void>;
    getAllDayLogs(dayStartNS: bigint): Promise<Array<DoseLog>>;
    getAllDayLogsRange(startTimeNS: bigint, endTimeNS: bigint): Promise<Array<DoseLog>>;
    getAllLogs(): Promise<Array<DoseLog>>;
    getAllReminderDayStats(dayStartNS: bigint): Promise<Array<ReminderDayStats>>;
    getAllReminderDayStatsRange(startTimeNS: bigint, endTimeNS: bigint): Promise<Array<ReminderDayStats>>;
    getAllReminderLogs(reminderId: string): Promise<Array<DoseLog>>;
    getAllReminders(): Promise<Array<MedicineReminder>>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentStreak(): Promise<bigint>;
    getDayStats(dayStartNS: bigint): Promise<DayStats>;
    getDayStatsRange(startTimeNS: bigint, endTimeNS: bigint): Promise<DayStats>;
    getMedicineInfo(brandName: string): Promise<string>;
    getPastNDayStats(nDays: bigint): Promise<Array<[bigint, DayStats]>>;
    getReminder(reminderId: string): Promise<MedicineReminder>;
    getReminderDayLogs(reminderId: string, dayStartNS: bigint): Promise<Array<DoseLog>>;
    getReminderDayLogsRange(reminderId: string, startTimeNS: bigint, endTimeNS: bigint): Promise<Array<DoseLog>>;
    getReminderDayStats(reminderId: string, dayStartNS: bigint): Promise<ReminderDayStats>;
    getReminderDayStatsRange(reminderId: string, startTimeNS: bigint, endTimeNS: bigint): Promise<ReminderDayStats>;
    isCallerAdmin(): Promise<boolean>;
    logDose(doseLog: DoseLog): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateReminder(reminder: MedicineReminder): Promise<void>;
}
