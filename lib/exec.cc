#include "./wrapped_re2.h"

#include <memory>
#include <vector>

#include <node_buffer.h>


using std::vector;

using v8::Array;
using v8::Integer;
using v8::Local;
using v8::String;

using node::Buffer;


NAN_METHOD(WrappedRE2::Exec) {
	NanScope();

	// unpack arguments

	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	if (!re2) {
		NanReturnNull();
	}

	vector<char> buffer;

	char*  data;
	size_t size, lastIndex = 0;
	bool   isBuffer = false;

	if (args[0]->IsString()) {
		if (re2->global) {
			String::Value s(args[0]);
			if (re2->lastIndex > s.length()) {
				re2->lastIndex = 0;
				NanReturnNull();
			}
			Local<String> t(String::New(*s + re2->lastIndex));
			buffer.resize(t->Utf8Length() + 1);
			t->WriteUtf8(&buffer[0]);
		} else {
			Local<String> t(args[0]->ToString());
			buffer.resize(t->Utf8Length() + 1);
			t->WriteUtf8(&buffer[0]);
		}
		size = buffer.size() - 1;
		data = &buffer[0];
	} else if (Buffer::HasInstance(args[0])) {
		isBuffer = true;
		size = Buffer::Length(args[0]);
		if (re2->global) {
			if (re2->lastIndex > size) {
				re2->lastIndex = 0;
				NanReturnNull();
			}
			lastIndex = re2->lastIndex;
		}
		data = Buffer::Data(args[0]);
	} else {
		NanReturnNull();
	}

	// actual work

	vector<StringPiece> groups(re2->regexp.NumberOfCapturingGroups() + 1);

	if (!re2->regexp.Match(StringPiece(data, size), lastIndex, size, RE2::UNANCHORED, &groups[0], groups.size())) {
		if (re2->global) {
			re2->lastIndex = 0;
		}
		NanReturnNull();
	}

	// form a result

	Local<Array> result = NanNew<Array>();

	if (isBuffer) {
		for (size_t i = 0, n = groups.size(); i < n; ++i) {
			const StringPiece& item = groups[i];
			result->Set(NanNew<Integer>(i), NanNewBufferHandle(item.data(), item.size()));
		}
		result->Set(NanNew("index"), NanNew<Integer>(groups[0].data() - data));
	} else {
		for (size_t i = 0, n = groups.size(); i < n; ++i) {
			const StringPiece& item = groups[i];
			result->Set(NanNew<Integer>(i), NanNew<String>(item.data(), item.size()));
		}
		result->Set(NanNew("index"), NanNew<Integer>(getUtf16Length(data, groups[0].data())));
	}

	result->Set(NanNew("input"), args[0]);

	if (re2->global) {
		re2->lastIndex += isBuffer ? groups[0].data() - data + groups[0].size() :
			getUtf16Length(data, groups[0].data() + groups[0].size());
	}

	NanReturnValue(result);
}
