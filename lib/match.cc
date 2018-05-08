#include "./wrapped_re2.h"
#include "./util.h"

#include <vector>


using std::vector;

using v8::Array;
using v8::Integer;
using v8::Local;
using v8::String;


NAN_METHOD(WrappedRE2::Match) {

	// unpack arguments

	WrappedRE2* re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	if (!re2) {
		info.GetReturnValue().SetNull();
		return;
	}

	StrVal str(info[0]);

	Utf8LastIndexGuard guard(re2, info[0], str);

	vector<StringPiece> groups;

	// actual work

	if (re2->global) {
		// global: collect all matches

		StringPiece match;
		re2->lastIndex = 0;

		while (re2->DoExec(str, match)) {
			groups.push_back(match);
		}

		if (groups.empty()) {
			info.GetReturnValue().SetNull();
			return;
		}
	} else {
		// non-global: just like exec()

		if (!re2->DoExec(str, groups)) {
			info.GetReturnValue().SetNull();
			return;
		}
	}

	// form a result

	Local<Array> result = Nan::New<Array>();

	if (str.isBuffer) {
		for (size_t i = 0, n = groups.size(); i < n; ++i) {
			const StringPiece& item = groups[i];
			if (item.data() != NULL) {
				Nan::Set(result, i, Nan::CopyBuffer(item.data(), item.size()).ToLocalChecked());
			}
		}
		if (!re2->global) {
			Nan::Set(result, Nan::New("index").ToLocalChecked(), Nan::New<Integer>(static_cast<int>(groups[0].data() - str.data)));
			Nan::Set(result, Nan::New("input").ToLocalChecked(), info[0]);
		}
	} else {
		for (size_t i = 0, n = groups.size(); i < n; ++i) {
			const StringPiece& item = groups[i];
			if (item.data() != NULL) {
				Nan::Set(result, i, Nan::New(item.data(), item.size()).ToLocalChecked());
			}
		}
		if (!re2->global) {
			Nan::Set(result, Nan::New("index").ToLocalChecked(), Nan::New<Integer>(static_cast<int>(getUtf16Length(str.data, groups[0].data()))));
			Nan::Set(result, Nan::New("input").ToLocalChecked(), info[0]);
		}
	}

	info.GetReturnValue().Set(result);
}
