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

	StrVal a(info[0]);
	if (!a.data) {
		return;
	}

	vector<StringPiece> groups;
	StringPiece str(a);
	size_t lastIndex = 0;

	// actual work

	if (re2->global && !re2->sticky) {
		// global: collect all matches

		StringPiece match;

		while (re2->regexp.Match(str, lastIndex, a.size, RE2::UNANCHORED, &match, 1)) {
			groups.push_back(match);
			lastIndex = match.data() - a.data + match.size();
		}

		if (groups.empty()) {
			info.GetReturnValue().SetNull();
			return;
		}
	} else {
		// non-global: just like exec()

		if (re2->sticky) {
			for (size_t n = re2->lastIndex; n; --n) {
				lastIndex += getUtf8CharSize(a.data[lastIndex]);
			}
		}

		groups.resize(re2->regexp.NumberOfCapturingGroups() + 1);
		if (!re2->regexp.Match(str, lastIndex, a.size, re2->sticky ? RE2::ANCHOR_START : RE2::UNANCHORED, &groups[0], groups.size())) {
			if (re2->sticky) {
				re2->lastIndex = 0;
			}
			info.GetReturnValue().SetNull();
			return;
		}
	}

	// form a result

	Local<Array> result = Nan::New<Array>();

	if (a.isBuffer) {
		for (size_t i = 0, n = groups.size(); i < n; ++i) {
			const StringPiece& item = groups[i];
			if (item.data() != NULL) {
				Nan::Set(result, i, Nan::CopyBuffer(item.data(), item.size()).ToLocalChecked());
			}
		}
		if (!re2->global) {
			Nan::Set(result, Nan::New("index").ToLocalChecked(), Nan::New<Integer>(static_cast<int>(groups[0].data() - a.data)));
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
			Nan::Set(result, Nan::New("index").ToLocalChecked(), Nan::New<Integer>(static_cast<int>(getUtf16Length(a.data, groups[0].data()))));
			Nan::Set(result, Nan::New("input").ToLocalChecked(), info[0]);
		}
	}

	if (!re2->global && re2->sticky) {
		re2->lastIndex += a.isBuffer ? groups[0].data() - a.data + groups[0].size() - lastIndex :
			getUtf16Length(a.data + lastIndex, groups[0].data() + groups[0].size());
	}

	info.GetReturnValue().Set(result);
}
