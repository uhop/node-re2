#include "./wrapped_re2.h"
#include "./util.h"

#include <vector>

NAN_METHOD(WrappedRE2::Match)
{

	// unpack arguments

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	if (!re2)
	{
		info.GetReturnValue().SetNull();
		return;
	}

	StrVal a(info[0]);
	if (!a.data)
	{
		return;
	}

	std::vector<re2::StringPiece> groups;
	re2::StringPiece str(a);
	size_t lastIndex = 0;
	auto anchor = re2::RE2::UNANCHORED;

	// actual work

	if (re2->global)
	{
		// global: collect all matches

		re2::StringPiece match;

		if (re2->sticky)
		{
			anchor = re2::RE2::ANCHOR_START;
		}

		while (re2->regexp.Match(str, lastIndex, a.size, anchor, &match, 1))
		{
			groups.push_back(match);
			lastIndex = match.data() - a.data + match.size();
		}

		if (groups.empty())
		{
			info.GetReturnValue().SetNull();
			return;
		}
	}
	else
	{
		// non-global: just like exec()

		if (re2->sticky)
		{
			for (size_t n = re2->lastIndex; n; --n)
			{
				size_t s = getUtf8CharSize(a.data[lastIndex]);
				lastIndex += s;
				if (s == 4 && n >= 2)
					--n; // this utf8 character will take two utf16 characters
						 // the decrement above is protected to avoid an overflow of an unsigned integer
			}
			anchor = RE2::ANCHOR_START;
		}

		groups.resize(re2->regexp.NumberOfCapturingGroups() + 1);
		if (!re2->regexp.Match(str, lastIndex, a.size, anchor, &groups[0], groups.size()))
		{
			if (re2->sticky)
			{
				re2->lastIndex = 0;
			}
			info.GetReturnValue().SetNull();
			return;
		}
	}

	// form a result

	auto result = Nan::New<v8::Array>(), indices = Nan::New<v8::Array>();

	if (a.isBuffer)
	{
		for (size_t i = 0, n = groups.size(); i < n; ++i)
		{
			const auto &item = groups[i];
			const auto data = item.data();
			if (data)
			{
				Nan::Set(result, i, Nan::CopyBuffer(data, item.size()).ToLocalChecked());
				if (!re2->global && re2->hasIndices)
				{
					auto pair = Nan::New<v8::Array>();
					auto offset = getUtf16Length(a.data + lastIndex, data);
					auto length = getUtf16Length(data, data + item.size());
					Nan::Set(pair, 0, Nan::New<v8::Integer>(static_cast<int>(offset)));
					Nan::Set(pair, 1, Nan::New<v8::Integer>(static_cast<int>(offset + length)));
					Nan::Set(indices, i, pair);
				}
			}
			else
			{
				Nan::Set(result, i, Nan::Undefined());
				if (!re2->global && re2->hasIndices)
				{
					Nan::Set(indices, i, Nan::Undefined());
				}
			}
		}
		if (!re2->global)
		{
			Nan::Set(result, Nan::New("index").ToLocalChecked(), Nan::New<v8::Integer>(static_cast<int>(groups[0].data() - a.data)));
			Nan::Set(result, Nan::New("input").ToLocalChecked(), info[0]);
		}
	}
	else
	{
		for (size_t i = 0, n = groups.size(); i < n; ++i)
		{
			const auto &item = groups[i];
			const auto data = item.data();
			if (data)
			{
				Nan::Set(result, i, Nan::New(data, item.size()).ToLocalChecked());
				if (!re2->global && re2->hasIndices)
				{
					auto pair = Nan::New<v8::Array>();
					auto offset = getUtf16Length(a.data + lastIndex, data);
					auto length = getUtf16Length(data, data + item.size());
					Nan::Set(pair, 0, Nan::New<v8::Integer>(static_cast<int>(offset)));
					Nan::Set(pair, 1, Nan::New<v8::Integer>(static_cast<int>(offset + length)));
					Nan::Set(indices, i, pair);
				}
			}
			else
			{
				Nan::Set(result, i, Nan::Undefined());
				if (!re2->global && re2->hasIndices)
				{
					Nan::Set(indices, i, Nan::Undefined());
				}
			}
		}
		if (!re2->global)
		{
			Nan::Set(result, Nan::New("index").ToLocalChecked(), Nan::New<v8::Integer>(static_cast<int>(getUtf16Length(a.data, groups[0].data()))));
			Nan::Set(result, Nan::New("input").ToLocalChecked(), info[0]);
		}
	}

	if (re2->global)
	{
		re2->lastIndex = 0;
	}
	else if (re2->sticky)
	{
		re2->lastIndex += a.isBuffer ? groups[0].data() - a.data + groups[0].size() - lastIndex : getUtf16Length(a.data + lastIndex, groups[0].data() + groups[0].size());
	}

	if (!re2->global)
	{
		const auto &groupNames = re2->regexp.CapturingGroupNames();
		if (!groupNames.empty())
		{
			auto groups = Nan::New<v8::Object>();
			Nan::SetPrototype(groups, Nan::Null());

			for (auto group : groupNames)
			{
				auto value = Nan::Get(result, group.first);
				if (!value.IsEmpty())
				{
					Nan::Set(groups, Nan::New(group.second).ToLocalChecked(), value.ToLocalChecked());
				}
			}

			Nan::Set(result, Nan::New("groups").ToLocalChecked(), groups);

			if (re2->hasIndices)
			{
				auto indexGroups = Nan::New<v8::Object>();
				Nan::SetPrototype(indexGroups, Nan::Null());

				for (auto group : groupNames)
				{
					auto value = Nan::Get(indices, group.first);
					if (!value.IsEmpty())
					{
						Nan::Set(indexGroups, Nan::New(group.second).ToLocalChecked(), value.ToLocalChecked());
					}
				}

				Nan::Set(indices, Nan::New("groups").ToLocalChecked(), indexGroups);
			}
		}
		else
		{
			Nan::Set(result, Nan::New("groups").ToLocalChecked(), Nan::Undefined());
			if (re2->hasIndices)
			{
				Nan::Set(indices, Nan::New("groups").ToLocalChecked(), Nan::Undefined());
			}
		}
	}

	if (re2->hasIndices)
	{
		Nan::Set(result, Nan::New("indices").ToLocalChecked(), indices);
	}

	info.GetReturnValue().Set(result);
}
