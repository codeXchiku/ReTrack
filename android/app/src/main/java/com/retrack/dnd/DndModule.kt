package com.retrack.dnd

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class DndModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "DndModule"

    @ReactMethod
    fun isPolicyAccessGranted(promise: Promise) {
        try {
            val granted = DndController.isPolicyAccessGranted(reactContext)
            promise.resolve(granted)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun openPolicyAccessSettings(promise: Promise) {
        try {
            DndController.openPolicyAccessSettings(reactContext)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun getStatus(promise: Promise) {
        try {
            val status = DndController.getStatus(reactContext)
            val map = Arguments.createMap().apply {
                putBoolean("granted", status.granted)
                putInt("currentFilter", status.currentFilter)
                putBoolean("ownedByApp", status.ownedByApp)
                putDouble("endsAt", status.endsAt.toDouble())
            }
            promise.resolve(map)
        } catch (e: Exception) {
            val fallback = Arguments.createMap().apply {
                putBoolean("granted", false)
                putInt("currentFilter", 0)
                putBoolean("ownedByApp", false)
                putDouble("endsAt", 0.0)
            }
            promise.resolve(fallback)
        }
    }

    @ReactMethod
    fun enter(endsAtMs: Double, promise: Promise) {
        try {
            val result = DndController.enter(reactContext, endsAtMs.toLong())
            promise.resolve(result)
        } catch (e: Exception) {
            promise.resolve("error")
        }
    }

    @ReactMethod
    fun exit(promise: Promise) {
        try {
            val result = DndController.exit(reactContext)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.resolve("error")
        }
    }
}
