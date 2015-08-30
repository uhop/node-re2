#include "./wrapped_re2.h"

#include <vector>

#include <node_buffer.h>


using std::vector;

using v8::Array;
using v8::Integer;
using v8::Local;
using v8::String;


NAN_METHOD(WrappedRE2::Exec) {

	// unpack arguments

	WrappedRE2* re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	if (!re2) {
		info.GetReturnValue().SetNull();
		return;
	}

	vector<char> buffer;

	char*  data;
	size_t size, lastIndex = 0;
	bool   isBuffer = false;

	if (node::Buffer::HasInstance(info[0])) {
		isBuffer = true;
		size = node::Buffer::Length(info[0]);
		if (re2->global) {
			if (re2->lastIndex > size) {
				re2->lastIndex = 0;
				info.GetReturnValue().SetNull();
				return;
			}
			lastIndex = re2->lastIndex;
		}
		data = node::Buffer::Data(info[0]);
	} else {
		if (re2->global && re2->lastIndex) {
			String::Value s(info[0]->ToString());
			if (re2->lastIndex > s.length()) {
				re2->lastIndex = 0;
				info.GetReturnValue().SetNull();
				return;
			}
			Local<String> t(Nan::New(*s + re2->lastIndex).ToLocalChecked());
			buffer.resize(t->Utf8Length() + 1);
			t->WriteUtf8(&buffer[0]);
		} else {
			Local<String> t(info[0]->ToString());
			buffer.resize(t->Utf8Length() + 1);
			t->WriteUtf8(&buffer[0]);
		}
		size = buffer.size() - 1;
		data = &buffer[0];
	}

	// actual work

	vector<StringPiece> groups(re2->regexp.NumberOfCapturingGroups() + 1);

	if (!re2->regexp.Match(StringPiece(data, size), lastIndex, size, RE2::UNANCHORED, &groups[0], groups.size())) {
		if (re2->global) {
			re2->lastIndex = 0;
		}
		info.GetReturnValue().SetNull();
		return;
	}

	// form a result

	Local<Array> result = Nan::New<Array>();

	if (isBuffer) {
		for (size_t i = 0, n = groups.size(); i < n; ++i) {
			const StringPiece& item = groups[i];
			Nan::Set(result, i, Nan::CopyBuffer(item.data(), item.size()).ToLocalChecked());
		}
		Nan::Set(result, Nan::New("index").ToLocalChecked(), Nan::New<Integer>(static_cast<int>(groups[0].data() - data)));
	} else {
		for (size_t i = 0, n = groups.size(); i < n; ++i) {
			const StringPiece& item = groups[i];
			Nan::Set(result, i, Nan::New(item.data(), item.size()).ToLocalChecked());
		}
		Nan::Set(result, Nan::New("index").ToLocalChecked(), Nan::New<Integer>(static_cast<int>(getUtf16Length(data, groups[0].data()))));
	}

	Nan::Set(result, Nan::New("input").ToLocalChecked(), info[0]);

	if (re2->global) {
		re2->lastIndex += isBuffer ? groups[0].data() - data + groups[0].size() - lastIndex :
			getUtf16Length(data, groups[0].data() + groups[0].size());
	}

	info.GetReturnValue().Set(result);
}
