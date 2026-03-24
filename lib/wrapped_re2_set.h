#pragma once

#include <nan.h>
#include <re2/re2.h>
#include <re2/set.h>

#include "./isolate_data.h"

#include <string>
#include <vector>

class WrappedRE2Set : public Nan::ObjectWrap
{
public:
	static v8::Local<v8::Function> Init();
	static inline bool HasInstance(v8::Local<v8::Object> object)
	{
		auto isolate = v8::Isolate::GetCurrent();
		auto data = getAddonData(isolate);
		if (!data || data->re2SetTpl.IsEmpty()) return false;
		return data->re2SetTpl.Get(isolate)->HasInstance(object);
	}

private:
	WrappedRE2Set(const re2::RE2::Options &options, re2::RE2::Anchor anchor, const std::string &flags) : set(options, anchor), flags(flags), anchor(anchor) {}

	static NAN_METHOD(New);
	static NAN_METHOD(Test);
	static NAN_METHOD(Match);
	static NAN_METHOD(ToString);

	static NAN_GETTER(GetFlags);
	static NAN_GETTER(GetSources);
	static NAN_GETTER(GetSource);
	static NAN_GETTER(GetSize);
	static NAN_GETTER(GetAnchor);

	re2::RE2::Set set;
	std::vector<std::string> sources;
	std::string combinedSource;
	std::string flags;
	re2::RE2::Anchor anchor;
};

