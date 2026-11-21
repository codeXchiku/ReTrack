package com.retrack.dnd

import android.app.AlarmManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings

object DndController {
    const val PREFS_NAME = "studydojo_dnd"
    const val KEY_PREVIOUS_FILTER = "previous_filter"
    const val KEY_OWNED_BY_APP = "owned_by_app"
    const val KEY_ENDS_AT = "ends_at"

    const val BACKUP_ALARM_OFFSET_MS = 15_000L
    const val REQUEST_CODE_DND_BACKUP = 4101
    const val ACTION_DND_RESTORE = "com.retrack.dnd.ACTION_DND_RESTORE"

    data class Status(
        val granted: Boolean,
        val currentFilter: Int,
        val ownedByApp: Boolean,
        val endsAt: Long,
    )

    fun isPolicyAccessGranted(context: Context): Boolean {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            ?: return false
        return nm.isNotificationPolicyAccessGranted
    }

    fun openPolicyAccessSettings(context: Context) {
        val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
    }

    fun getStatus(context: Context): Status {
        val granted = isPolicyAccessGranted(context)
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        val currentFilter = nm?.currentInterruptionFilter ?: NotificationManager.INTERRUPTION_FILTER_UNKNOWN

        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val ownedByApp = prefs.getBoolean(KEY_OWNED_BY_APP, false)
        val endsAt = prefs.getLong(KEY_ENDS_AT, 0L)

        return Status(
            granted = granted,
            currentFilter = currentFilter,
            ownedByApp = ownedByApp,
            endsAt = endsAt,
        )
    }

    fun enter(context: Context, endsAtMs: Long): String {
        return try {
            if (!isPolicyAccessGranted(context)) {
                return "not_granted"
            }

            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
                ?: return "error"
            val currentFilter = nm.currentInterruptionFilter
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val isOwned = prefs.getBoolean(KEY_OWNED_BY_APP, false)

            if (isOwned) {
                // If we already own the state: do not overwrite previousFilter,
                // update endsAt and re-schedule the alarm
                prefs.edit()
                    .putLong(KEY_ENDS_AT, endsAtMs)
                    .commit()
                scheduleBackupAlarm(context, endsAtMs + BACKUP_ALARM_OFFSET_MS)
                return "applied"
            }

            // User is already in a quiet mode: PRIORITY (2), NONE (3), ALARMS (4)
            val isQuiet = currentFilter == NotificationManager.INTERRUPTION_FILTER_PRIORITY ||
                currentFilter == NotificationManager.INTERRUPTION_FILTER_NONE ||
                currentFilter == NotificationManager.INTERRUPTION_FILTER_ALARMS

            if (isQuiet) {
                // Do NOT change anything and do NOT take ownership
                return "already_quiet"
            }

            // Normal state: INTERRUPTION_FILTER_ALL (1) or UNKNOWN (0)
            val previousFilter = if (currentFilter == NotificationManager.INTERRUPTION_FILTER_UNKNOWN) {
                NotificationManager.INTERRUPTION_FILTER_ALL
            } else {
                currentFilter
            }

            nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_PRIORITY)

            prefs.edit()
                .putInt(KEY_PREVIOUS_FILTER, previousFilter)
                .putBoolean(KEY_OWNED_BY_APP, true)
                .putLong(KEY_ENDS_AT, endsAtMs)
                .commit()

            scheduleBackupAlarm(context, endsAtMs + BACKUP_ALARM_OFFSET_MS)
            "applied"
        } catch (e: Exception) {
            "error"
        }
    }

    fun exit(context: Context): String {
        return try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val isOwned = prefs.getBoolean(KEY_OWNED_BY_APP, false)

            if (!isOwned) {
                return "nothing_to_restore"
            }

            val granted = isPolicyAccessGranted(context)
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager

            if (!granted || nm == null) {
                // If not granted anymore, clear ownership and cancel alarm anyway
                prefs.edit()
                    .putBoolean(KEY_OWNED_BY_APP, false)
                    .putLong(KEY_ENDS_AT, 0L)
                    .remove(KEY_PREVIOUS_FILTER)
                    .commit()
                cancelAlarm(context)
                return "restored"
            }

            val currentFilter = nm.currentInterruptionFilter

            // Restore previousFilter ONLY IF current filter is still the one we set (PRIORITY).
            // If the user changed it meanwhile, leave it.
            if (currentFilter == NotificationManager.INTERRUPTION_FILTER_PRIORITY) {
                val previousFilter = prefs.getInt(KEY_PREVIOUS_FILTER, NotificationManager.INTERRUPTION_FILTER_ALL)
                nm.setInterruptionFilter(previousFilter)
            }

            // Then clear ownership and cancel the alarm
            prefs.edit()
                .putBoolean(KEY_OWNED_BY_APP, false)
                .putLong(KEY_ENDS_AT, 0L)
                .remove(KEY_PREVIOUS_FILTER)
                .commit()
            cancelAlarm(context)
            "restored"
        } catch (e: Exception) {
            "error"
        }
    }

    fun scheduleBackupAlarm(context: Context, triggerAtMs: Long) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val intent = Intent(context, DndRestoreReceiver::class.java).apply {
            action = ACTION_DND_RESTORE
        }
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            REQUEST_CODE_DND_BACKUP,
            intent,
            flags,
        )

        alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, pendingIntent)
    }

    fun cancelAlarm(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val intent = Intent(context, DndRestoreReceiver::class.java).apply {
            action = ACTION_DND_RESTORE
        }
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            REQUEST_CODE_DND_BACKUP,
            intent,
            flags,
        )

        alarmManager.cancel(pendingIntent)
        pendingIntent.cancel()
    }
}
