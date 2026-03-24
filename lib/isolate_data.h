#pragma once

#include <nan.h>

struct AddonData {
	Nan::Persistent<v8::FunctionTemplate> re2Tpl;
	Nan::Persistent<v8::FunctionTemplate> re2SetTpl;
};

AddonData *getAddonData(v8::Isolate *isolate);
void setAddonData(v8::Isolate *isolate, AddonData *data);
void deleteAddonData(v8::Isolate *isolate);
