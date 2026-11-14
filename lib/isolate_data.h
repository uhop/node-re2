#pragma once

#include <nan.h>

struct AddonData {
	Nan::Persistent<v8::FunctionTemplate> re2Tpl;
	Nan::Persistent<v8::FunctionTemplate> re2SetTpl;

	// Nan::Persistent does not reset its handle in its destructor. Without these
	// Reset() calls, the templates keep their context alive, and memory leaks.
	~AddonData() {
		re2Tpl.Reset();
		re2SetTpl.Reset();
	}
};

AddonData *getAddonData(v8::Isolate *isolate);
void setAddonData(v8::Isolate *isolate, AddonData *data);
void deleteAddonData(v8::Isolate *isolate);
