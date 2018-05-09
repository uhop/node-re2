#ifndef UTIL_H_
#define UTIL_H_

#include "./wrapped_re2.h"

#include <vector>


struct StrVal {
	std::vector<char> buffer;
	char*  data;
	size_t size;
	size_t startIndex;
	bool   isBuffer;
	v8::MaybeLocal<v8::String> original;

	StrVal() : data(NULL), size(0), startIndex(0), isBuffer(false), original() {}
	StrVal(const v8::Local<v8::Value>& arg, size_t startIndexHint = 0);

	inline bool IsEmpty() const { return data == NULL; }

	operator StringPiece () { return StringPiece(data, size); }
	operator const StringPiece () const { return StringPiece(data, size); }
};


template<typename T>
class ToStringHelper {
		v8::MaybeLocal<v8::String> str_;
		T* value_;

	public:
		inline ToStringHelper(const v8::Local<v8::Value>& value) : str_(value->ToString(v8::Isolate::GetCurrent()->GetCurrentContext())), value_(NULL) {
			if (!str_.IsEmpty()) {
				value_ = new T(str_.ToLocalChecked());
			}
		}
		ToStringHelper(const ToStringHelper&) = delete;
		inline ~ToStringHelper() {
			if (value_) {
				delete value_;
			}
		}

		ToStringHelper& operator =(const ToStringHelper&) = delete;

		inline bool IsEmpty() const { return value_ == NULL; }

		inline T& Unwrap() { return *value_; }
		inline const T& Unwrap() const { return *value_; }
};


class Utf8LastIndexGuard {
		WrappedRE2*   re2_;
		const StrVal& input_;

	public:
		Utf8LastIndexGuard(WrappedRE2* re2, StrVal& input);
		Utf8LastIndexGuard(const Utf8LastIndexGuard&) = delete;
		~Utf8LastIndexGuard();

		Utf8LastIndexGuard& operator =(const Utf8LastIndexGuard&) = delete;

		inline void DontRestore() { re2_ = NULL; }
};


#endif
